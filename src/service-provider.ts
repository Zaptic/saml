import * as url from 'url'
import { checkSignature, decryptXML, signXML } from './crypto'
import { decodePostResponse, encodeRedirectParameters } from './helpers/encoding'
import { loadXSD, Validator } from './helpers/xml'
import * as LoginResponse from './login-response'
import * as Metadata from './metadata'
import getMetadataXML from './templates/metadata'
import getLoginXML from './templates/login-request'

export interface IDPOptions {
    id: string
    loginUrl: string
    signature: {
        algorithm: 'sha256' | 'sha512'
        allowedCertificates: string[]
    }
}

export interface SPOptions {
    id: string
    singleLogoutUrl: string
    assertionUrl: string
    signature: {
        certificate: string
        key: string
        algorithm: 'sha256' | 'sha512'
    }
    // Uses the same certificates as signature if not provided
    encryption?: {
        certificate: string // Unused for now
        key: string
        algorithm: 'sha256' | 'sha512' // Unused for now
    }
}

export interface Preferences {
    signLoginRequests: boolean
    strictTimeCheck: boolean
    attributeMapping: { [attribute: string]: string }
    nameIdFormat: string
    addNameIdPolicy: boolean
    forceAuthenticationByDefault: boolean
}

export interface OptionsWithoutMetadata {
    preferences?: Partial<Preferences>
    getUUID: () => string | Promise<string>
    idp: IDPOptions
    sp: SPOptions
}

export interface OptionsWithMetadata {
    preferences?: Partial<Preferences>
    getUUID: () => string | Promise<string>
    idp: string
    sp: SPOptions
}

interface SAMLProviderOptions {
    XSDs: {
        protocol: Validator
        metadata: Validator
    }
    preferences: Preferences
    identityProvider: IDPOptions
    serviceProvider: SPOptions
    getUUID: () => string | Promise<string>
}

function hasMetadata(options: OptionsWithoutMetadata | OptionsWithMetadata): options is OptionsWithMetadata {
    return typeof options.idp === 'string'
}

export default class SAMLProvider {
    public static async create(options: OptionsWithoutMetadata | OptionsWithMetadata) {
        const XSDs = {
            protocol: loadXSD('saml-schema-protocol-2.0.xsd'),
            metadata: loadXSD('saml-schema-metadata-2.0.xsd')
        }

        const preferences = {
            // Defaults
            nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            strictTimeCheck: false,
            signLoginRequests: true,
            attributeMapping: {},
            addNameIdPolicy: false,
            forceAuthenticationByDefault: false,
            // User
            ...(options.preferences || {})
        }
        const identityProvider = hasMetadata(options)
            ? (await Metadata.extract(options.idp)).identityProvider
            : options.idp
        const serviceProvider = options.sp

        // Default the encryption certificates to the signatures one to reduce verbosity of the options
        if (!serviceProvider.encryption) serviceProvider.encryption = serviceProvider.signature

        return new SAMLProvider({ XSDs, preferences, identityProvider, serviceProvider, getUUID: options.getUUID })
    }

    public readonly XSDs: SAMLProviderOptions['XSDs']
    public readonly preferences: SAMLProviderOptions['preferences']

    private readonly identityProvider: SAMLProviderOptions['identityProvider']
    private readonly serviceProvider: SAMLProviderOptions['serviceProvider']
    private readonly getUUID: SAMLProviderOptions['getUUID']

    private constructor(options: SAMLProviderOptions) {
        this.XSDs = options.XSDs
        this.preferences = options.preferences
        this.identityProvider = options.identityProvider
        this.serviceProvider = options.serviceProvider
        this.getUUID = options.getUUID
    }

    public async buildLoginRequestRedirectURL(
        relayState?: string,
        forceAuthentication = this.preferences.forceAuthenticationByDefault
    ) {
        const request = getLoginXML(await this.getUUID(), {
            serviceProviderId: this.serviceProvider.id,
            assertionUrl: this.serviceProvider.assertionUrl,
            loginUrl: this.identityProvider.loginUrl,
            forceAuthentication,
            addNameIdPolicy: this.preferences.addNameIdPolicy
        })
        const xml = this.preferences.signLoginRequests ? signXML(request, this.serviceProvider.signature) : request

        // Google uses SingleSignOnService URLs that have a query param set in them so we need to detect that and build
        // the url accordingly
        if (url.parse(this.identityProvider.loginUrl).query) {
            return this.identityProvider.loginUrl + '&' + (await encodeRedirectParameters(xml, relayState))
        }

        return this.identityProvider.loginUrl + '?' + (await encodeRedirectParameters(xml, relayState))
    }

    public async parseLoginResponse(query: { [key: string]: any }) {
        const relayState: string = query.ReplayState
        const rawResponse: string = query.SAMLResponse && decodePostResponse(query.SAMLResponse)

        // Check that the response is not empty
        if (!rawResponse) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await this.XSDs.protocol(rawResponse)

        // Potentially decrypt the assertions
        const decryptedResponse = await decryptXML(rawResponse, this.serviceProvider.encryption!.key)

        // Check the signature - this should throw if there is an error
        checkSignature(decryptedResponse, this.identityProvider.signature)

        const checkOptions = {
            issuer: this.identityProvider.id,
            audience: this.serviceProvider.id,
            strictTimeCheck: this.preferences.strictTimeCheck
        }

        const response = await LoginResponse.extract(decryptedResponse, this.preferences.attributeMapping, checkOptions)

        return { response, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.serviceProvider, this.preferences.nameIdFormat)
    }
}
