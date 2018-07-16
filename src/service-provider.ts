import { checkSignature, signXML } from './signature'
import { decodePostResponse, encodeRedirectParameters } from './helpers/encoding'
import * as xsd from 'libxml-xsd'
import { loadXSD, validateXML } from './helpers/xml'
import { checkResponse, extract } from './login-response'
import getMetadataXML from './templates/metadata'
import getLoginXML from './templates/loginRequest'

type IDPOptions = {
    id: string
    loginUrl: string
    signature: {
        certificate: string
        algorithm: 'sha256' | 'sha512'
        allowedCertificates: string[]
    }
}

type SPOptions = {
    id: string
    singleLogoutUrl: string
    assertionUrl: string
    signature: {
        certificate: string
        key: string
        algorithm: 'sha256' | 'sha512'
    }
}

export type Options = {
    signLoginRequests?: boolean
    strictTimeCheck?: boolean
    attributeMapping?: { [attribute: string]: string }
    nameIdFormat?: string
    getUUID: () => string | Promise<string>
    idp: IDPOptions
    sp: SPOptions
}

export default class SAMLProvider {
    public protocolSchema: { validate: xsd.ValidateFunction } | null = null
    public metadataShema: { validate: xsd.ValidateFunction } | null = null
    private readonly options: Options & {
        nameIdFormat: string
        strictTimeCheck: boolean
        attributeMapping: { [attribute: string]: string }
    }

    constructor(options: Options) {
        this.options = {
            nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            strictTimeCheck: false,
            signLoginRequests: true,
            attributeMapping: {},
            ...options
        }
    }

    public async init() {
        this.protocolSchema = await loadXSD('saml-schema-protocol-2.0.xsd')
        this.metadataShema = await loadXSD('saml-schema-metadata-2.0.xsd')
        return this
    }

    public async buildLoginRequestRedirectURL(relayState?: string) {
        const request = getLoginXML(await this.options.getUUID(), this.options)
        const xml = this.options.signLoginRequests ? signXML(request, this.options.sp.signature) : request

        return this.options.idp.loginUrl + '?' + (await encodeRedirectParameters(xml, relayState))
    }

    public async parseLoginResponse(query: { [key: string]: any }) {
        if (this.protocolSchema === null) throw new Error('Call init() first')

        const relayState: string = query.ReplayState
        const rawResponse: string = query.SAMLResponse && decodePostResponse(query.SAMLResponse)

        // Check that the response is not empty
        if (!rawResponse) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await validateXML(rawResponse, this.protocolSchema)

        // Check the signature - this should throw if there is an error
        checkSignature(rawResponse, this.options.idp.signature)

        const response = await extract(rawResponse, this.options.attributeMapping)

        checkResponse(response, {
            issuer: this.options.idp.id,
            audience: this.options.sp.id,
            strictTimeCheck: this.options.strictTimeCheck
        })

        return { response, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.options.sp, this.options.nameIdFormat)
    }
}
