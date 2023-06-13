import * as url from 'url'
import { checkSignature, decryptXML, signXML } from './crypto'
import { decodePostResponse, encodePostFormFields, encodeRedirectParameters } from './helpers/encoding'
import { loadXSD, Validator } from './helpers/xml'
import * as LoginResponse from './login-response'
import * as Metadata from './metadata'
import getMetadataXML from './templates/metadata'
import getLoginXML from './templates/login-request'
import { Certificate, getNonExpired } from './helpers/certificate'

export interface IDPOptions {
    id: string
    redirectLoginUrl: string
    postLoginUrl: string
    signature: {
        algorithm: 'sha256' | 'sha512'
        allowedCertificates: string[]
    }
}

export interface SPOptions {
    id: string
    singleLogoutUrl: string
    assertionUrl: string
    signature: Certificate[]
    // Uses the same certificates as signature if not provided
    encryption?: Certificate[]
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

/*
 * Data to be inserted into a hidden form and auto-submitted to use the HTTP-POST binding.
 */
export interface LoginRequestPostFormData {
    action: string
    fields: {
        SAMLRequest: string
        RelayState?: string
    }
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

    private async buildLoginRequestXML(forceAuthentication: boolean) {
        const request = getLoginXML(await this.getUUID(), {
            serviceProviderId: this.serviceProvider.id,
            assertionUrl: this.serviceProvider.assertionUrl,
            loginUrl: this.identityProvider.redirectLoginUrl,
            forceAuthentication,
            addNameIdPolicy: this.preferences.addNameIdPolicy
        })
        const xml = this.preferences.signLoginRequests
            ? signXML(request, getNonExpired(this.serviceProvider.signature))
            : request

        return xml
    }

    public async buildLoginRequestRedirectURL(
        relayState?: string,
        forceAuthentication = this.preferences.forceAuthenticationByDefault
    ) {
        const xml = await this.buildLoginRequestXML(forceAuthentication)

        // Google uses SingleSignOnService URLs that have a query param set in them so we need to detect that and build
        // the url accordingly
        if (url.parse(this.identityProvider.redirectLoginUrl).query) {
            return this.identityProvider.redirectLoginUrl + '&' + (await encodeRedirectParameters(xml, relayState))
        }

        return this.identityProvider.redirectLoginUrl + '?' + (await encodeRedirectParameters(xml, relayState))
    }

    public async buildLoginRequestPostFormData(
        relayState?: string,
        forceAuthentication = this.preferences.forceAuthenticationByDefault
    ): Promise<LoginRequestPostFormData> {
        const xml = await this.buildLoginRequestXML(forceAuthentication)

        return { action: this.identityProvider.postLoginUrl, fields: encodePostFormFields(xml, relayState) }
    }

    public async parseLoginResponse<T extends { [key: string]: string }>(query: {
        [key: string]: any
    }): Promise<{ response: LoginResponse.LoginResponse; relayState: string }> {
        const relayState: string = query.ReplayState
        const rawResponse: string = query.SAMLResponse && decodePostResponse(query.SAMLResponse)

        // Check that the response is not empty
        if (!rawResponse) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await this.XSDs.protocol(rawResponse)

        // Potentially decrypt the assertions
        const decryptedResponse = await decryptXML(rawResponse, getNonExpired(this.serviceProvider.encryption!).key)

        // Check the signature - this should throw if there is an error
        checkSignature(decryptedResponse, this.identityProvider.signature)

        const checkOptions = {
            issuer: this.identityProvider.id,
            audience: this.serviceProvider.id,
            strictTimeCheck: this.preferences.strictTimeCheck
        }

        const response = await LoginResponse.extract<T>(
            decryptedResponse,
            this.preferences.attributeMapping as T,
            checkOptions
        )

        return { response, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.serviceProvider, this.preferences.nameIdFormat)
    }
}
