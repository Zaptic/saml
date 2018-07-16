import { checkSignature, signXML } from './signature'
import { fromBase64, toX059, encodeRedirectParameters } from './helpers'
import * as xsd from 'libxml-xsd'
import * as xml2js from 'xml2js'
import { checkStatusCodes, checkTime } from './checks'
import { loadXSD } from './xml'
import { AttributeStatement, SAMLResponse } from './saml-response'
import * as url from 'url'

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
        const relayState: string = query.ReplayState
        const rawResponse: string = query.SAMLResponse && fromBase64(query.SAMLResponse)

        // Check that the response is not empty
        if (!rawResponse) throw new Error('Empty SAMLResponse')

        // Check that the xml is valid
        await new Promise((resolve, reject) => {
            if (this.protocolSchema === null) throw new Error('Call init() first')

            this.protocolSchema.validate(rawResponse, (technicalErrors, validationErrors) => {
                if (technicalErrors) return reject(`Technical errors: ${technicalErrors}`)
                if (validationErrors) return reject(`Validation errors: ${validationErrors}`)
                resolve()
            })
        })

        // Check the signature - this should throw if there is an error
        checkSignature(rawResponse, this.options.idp.signature)

        const response = await this.extract(rawResponse)

        // Check status codes
        if (!checkStatusCodes(response.statusCodes)) throw new Error('Invalid status code')

        // Check the issuer
        if (response.issuer !== this.options.idp.id) throw new Error('Unknown issuer')

        // Prefix the sp id with spn: if it's not a url - this is what microsoft seems to do so let's duplicate for now
        // If this leads to issues then we can make the prefix a parameter
        const expectedAudience = url.parse(this.options.sp.id).hostname
            ? this.options.sp.id
            : 'spn:' + this.options.sp.id

        response.assertions.forEach(assertion => {
            // Check the audience
            if (assertion.audience !== expectedAudience) throw new Error('Unexpected audience')

            // Check the time - dates are ISO according to spec
            const beforeDate = new Date(assertion.notBefore)
            const afterDate = new Date(assertion.notOnOrAfter)
            if (!checkTime(beforeDate, afterDate, this.options.strictTimeCheck)) throw new Error('Assertion expired')
        })

        return { response, relayState }
    }

    public getMetadata() {
        return getMetadataXML(this.options.sp, this.options.nameIdFormat)
    }

    private async extract(response: string) {
        const jsonResponse = await new Promise<SAMLResponse>((resolve, reject) => {
            const options = {
                tagNameProcessors: [xml2js.processors.stripPrefix],
                attrNameProcessors: [xml2js.processors.stripPrefix],
                explicitRoot: false
            }

            xml2js.parseString(response, options, (error, result) => {
                if (error) return reject(error)
                resolve(result)
            })
        })

        const parsedResponse = {
            id: jsonResponse.$.ID,
            inResponseTo: jsonResponse.$.InResponseTo,
            issuer: jsonResponse.Issuer[0]._,
            statusCodes: jsonResponse.Status[0].StatusCode.map(statusCode => statusCode.$.Value),
            assertions: jsonResponse.Assertion.map((assertion: any) => ({
                issuer: assertion.Issuer[0],
                sessionIndex: assertion.AuthnStatement[0].$.SessionIndex,
                notBefore: assertion.Conditions[0].$.NotBefore,
                notOnOrAfter: assertion.Conditions[0].$.NotOnOrAfter,
                audience: assertion.Conditions[0].AudienceRestriction[0].Audience[0],
                attributes: assertion.AttributeStatement[0].Attribute.reduce(
                    (accum: { [key: string]: string }, attribute: AttributeStatement['Attribute']) => {
                        const mappedName = this.options.attributeMapping[attribute.$.Name]
                        if (mappedName) accum[mappedName] = attribute.AttributeValue[0]
                        else accum[attribute.$.Name] = attribute.AttributeValue[0]
                        return accum
                    },
                    {}
                )
            }))
        }

        return parsedResponse
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
