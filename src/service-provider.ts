import { checkSignature, signXML } from './signature'
import { decodePostResponse, encodeRedirectParameters } from './helpers/encoding'
import * as xsd from 'libxml-xsd'
import { loadXSD, validateXML } from './helpers/xml'
import * as LoginResponse from './login-response'
import * as Metadata from './metadata'
import getMetadataXML from './templates/metadata'
import getLoginXML from './templates/login-request'

export type IDPOptions = {
    id: string
    loginUrl: string
    signature: {
        algorithm: 'sha256' | 'sha512'
        allowedCertificates: string[]
    }
}

export type SPOptions = {
    id: string
    singleLogoutUrl: string
    assertionUrl: string
    signature: {
        certificate: string
        key: string
        algorithm: 'sha256' | 'sha512'
    }
}

export type Preferences = {
    signLoginRequests: boolean
    strictTimeCheck: boolean
    attributeMapping: { [attribute: string]: string }
    nameIdFormat: string
}

export type OptionsWithoutMetadata = {
    preferences?: Partial<Preferences>
    getUUID: () => string | Promise<string>
    idp: IDPOptions
    sp: SPOptions
}

export type OptionsWithMetadata = {
    preferences?: Partial<Preferences>
    getUUID: () => string | Promise<string>
    idp: string
    sp: SPOptions
}

type SAMLProviderOptions = {
    XSDs: {
        protocol: { validate: xsd.ValidateFunction }
        metadata: { validate: xsd.ValidateFunction }
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
            protocol: await loadXSD('saml-schema-protocol-2.0.xsd'),
            metadata: await loadXSD('saml-schema-metadata-2.0.xsd')
        }

        const preferences = {
            // Defaults
            nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            strictTimeCheck: false,
            signLoginRequests: true,
            attributeMapping: {},
            // User
            ...(options.preferences || {})
        }
        const identityProvider = hasMetadata(options)
            ? (await Metadata.extract(options.idp)).identityProvider
            : options.idp
        const serviceProvider = options.sp

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

    public async buildLoginRequestRedirectURL(relayState?: string, forceAuthentication = false) {
        const request = getLoginXML(await this.getUUID(), {
            serviceProviderId: this.serviceProvider.id,
            assertionUrl: this.serviceProvider.assertionUrl,
            loginUrl: this.identityProvider.loginUrl,
            forceAuthentication
        })
        const xml = this.preferences.signLoginRequests ? signXML(request, this.serviceProvider.signature) : request

        return this.identityProvider.loginUrl + '?' + (await encodeRedirectParameters(xml, relayState))
    }

    public async parseLoginResponse(query: { [key: string]: any }) {
        const relayState: string = query.ReplayState
        const rawResponse: string = query.SAMLResponse && decodePostResponse(query.SAMLResponse)

        // Check that the response is not empty
        if (!rawResponse) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await validateXML(rawResponse, this.XSDs.protocol)

        // Check the signature - this should throw if there is an error
        checkSignature(rawResponse, this.identityProvider.signature)

        const checkOptions = {
            issuer: this.identityProvider.id,
            audience: this.serviceProvider.id,
            strictTimeCheck: this.preferences.strictTimeCheck
        }

        const response = await LoginResponse.extract(rawResponse, this.preferences.attributeMapping, checkOptions)

        return { response, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.serviceProvider, this.preferences.nameIdFormat)
    }
}
