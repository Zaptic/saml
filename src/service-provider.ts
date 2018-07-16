import { checkSignature, signXML } from './signature'
import { fromBase64, toX059, encodeRedirectParameters } from './helpers'
import * as xsd from 'libxml-xsd'
import { checkStatusCode, checkTime } from './checks'
import { XPath, extractFields, getAttribute, getText, loadXSD } from './xml'

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
    attributeMapping?: { [key: string]: XPath }
    strictTimeCheck?: boolean
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
        attributeMapping: { [key: string]: XPath }
    }

    constructor(options: Options) {
        this.options = {
            nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            strictTimeCheck: false,
            attributeMapping: {},
            signLoginRequests: true,
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
        const relayState: string = query.ReplayState
        const response: string = query.SAMLResponse && fromBase64(query.SAMLResponse)

        // Check that the response is not empty
        if (!response) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await new Promise((resolve, reject) => {
            if (this.protocolSchema === null) throw new Error('Call init() first')

            this.protocolSchema.validate(response, (technicalErrors, validationErrors) => {
                if (technicalErrors) return reject(`Technical errors: ${technicalErrors}`)
                if (validationErrors) return reject(`Validation errors: ${validationErrors}`)
                resolve()
            })
        })

        // Check the signature - this should throw if there is an error
        checkSignature(response, this.options.idp.signature)

        const assertion = this.extract(response)

        // Check status code
        if (!checkStatusCode(assertion.statusCode)) throw new Error('Invalid status code')

        // Check the audience
        if (assertion.id !== this.options.sp.id) throw new Error('Unexpected audience')

        // Check the issuer
        if (assertion.id !== this.options.idp.id) throw new Error('Unknown issuer')

        // Check the time - dates are ISO according to spec
        const beforeDate = new Date(assertion.notBefore)
        const afterDate = new Date(assertion.notOnOrAfter)
        if (!checkTime(beforeDate, afterDate, this.options.strictTimeCheck)) throw new Error('Assertion expired')

        return { assertion, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.options.sp, this.options.nameIdFormat)
    }

    private extract(response: string) {
        const mapping = {
            notBefore: getAttribute('Conditions', 'NotBefore'),
            notOnOrAfter: getAttribute('Conditions', 'NotOnOrAfter'),
            inResponseTo: getAttribute('Response', 'InResponseTo'),
            sessionIndex: getAttribute('AuthnStatement', 'SessionIndex'),
            issuer: getText('Issuer'),
            audience: getText('Audience'),
            nameId: getText('NameID'),
            statusCode: getAttribute('StatusCode', 'Value'),
            ...this.options.attributeMapping
        }

        return extractFields(response, mapping)
    }
}

const getMetadataXML = (options: SPOptions, nameIdFormat: string) =>
    `<EntityDescriptor
        xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
        entityID="${options.id}">

        <SPSSODescriptor
            AuthnRequestsSigned="true"
            WantAssertionsSigned="true"
            protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

            <KeyDescriptor use="signing">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${toX059(options.signature.certificate)}</X509Certificate>
                    </X509Data>
                </KeyInfo>
            </KeyDescriptor>

            <KeyDescriptor use="encryption">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${toX059(options.signature.certificate)}</X509Certificate>
                    </X509Data>
                </KeyInfo>

            </KeyDescriptor>

            <SingleLogoutService
                Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                Location="${options.singleLogoutUrl}"/>

            <NameIDFormat>${nameIdFormat}</NameIDFormat>

            <AssertionConsumerService
                Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                Location="${options.assertionUrl}"
                index="1"/>

        </SPSSODescriptor>
    </EntityDescriptor>`

const getLoginXML = (id: string, options: Options) =>
    `<samlp:AuthnRequest
            AssertionConsumerServiceURL="${options.sp.assertionUrl}"
            Destination="${options.idp.loginUrl}"
            ID="${'_' + id}"
            IssueInstant="${new Date().toISOString()}"
            ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Version="2.0"
            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
            xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Issuer>${options.sp.id}</saml:Issuer>
    </samlp:AuthnRequest>`
        .replace(/>\n */g, '>')
        .replace(/\n\s*/g, ' ') // Remove formatting to make sure it does not the redirect request
