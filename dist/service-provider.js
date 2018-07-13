"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const signature_1 = require("./signature");
const helpers_1 = require("./helpers");
const querystring = require("querystring");
const checks_1 = require("./checks");
const xml_1 = require("./xml");
class SAMLProvider {
    constructor(options) {
        this.protocolSchema = null;
        this.metadataShema = null;
        this.options = Object.assign({ nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress', strictTimeCheck: false, attributeMapping: {}, signLoginRequests: true }, options);
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.protocolSchema = yield xml_1.loadXSD('saml-schema-protocol-2.0.xsd');
            this.metadataShema = yield xml_1.loadXSD('saml-schema-metadata-2.0.xsd');
            return this;
        });
    }
    buildLoginRequestRedirectURL(RelayState) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield getLoginXML(yield this.options.getUUID(), this.options);
            const SAMLRequest = helpers_1.toBase64(this.options.signLoginRequests ? signature_1.signXML(request, this.options.sp.signature) : request);
            const params = RelayState
                ? querystring.stringify({ SAMLRequest, RelayState })
                : querystring.stringify({ SAMLRequest });
            return this.options.idp.loginUrl + '?' + params;
        });
    }
    parseLoginResponse(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const relayState = query.ReplayState;
            const response = query.SAMLResponse && helpers_1.fromBase64(query.SAMLResponse);
            // Check that the response is not empty
            if (!response)
                throw new Error('Empty SAMLResponse');
            // Check that the xml is valid
            yield new Promise((resolve, reject) => {
                if (this.protocolSchema === null)
                    throw new Error('Call init() first');
                this.protocolSchema.validate(response, (technicalErrors, validationErrors) => {
                    if (technicalErrors)
                        return reject(`Technical errors: ${technicalErrors}`);
                    if (validationErrors)
                        return reject(`Validation errors: ${validationErrors}`);
                    resolve();
                });
            });
            // Check the signature - this should throw if there is an error
            signature_1.checkSignature(response, this.options.idp.signature);
            const assertion = this.extract(response);
            // Check status code
            if (!checks_1.checkStatusCode(assertion.statusCode))
                throw new Error('Invalid status code');
            // Check the audience
            if (assertion.id !== this.options.sp.id)
                throw new Error('Unexpected audience');
            // Check the issuer
            if (assertion.id !== this.options.idp.id)
                throw new Error('Unknown issuer');
            // Check the time - dates are ISO according to spec
            const beforeDate = new Date(assertion.notBefore);
            const afterDate = new Date(assertion.notOnOrAfter);
            if (!checks_1.checkTime(beforeDate, afterDate, this.options.strictTimeCheck))
                throw new Error('Assertion expired');
            return { assertion, relayState };
        });
    }
    getMetadata() {
        return getMetadataXML(this.options.sp, this.options.nameIdFormat);
    }
    extract(response) {
        const mapping = Object.assign({ notBefore: xml_1.getAttribute('Conditions', 'NotBefore'), notOnOrAfter: xml_1.getAttribute('Conditions', 'NotOnOrAfter'), inResponseTo: xml_1.getAttribute('Response', 'InResponseTo'), sessionIndex: xml_1.getAttribute('AuthnStatement', 'SessionIndex'), issuer: xml_1.getText('Issuer'), audience: xml_1.getText('Audience'), nameId: xml_1.getText('NameID'), statusCode: xml_1.getAttribute('StatusCode', 'Value') }, this.options.attributeMapping);
        return xml_1.extractFields(response, mapping);
    }
}
exports.default = SAMLProvider;
const getMetadataXML = (options, nameIdFormat) => `<EntityDescriptor
        xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
        entityID="${options.id}">

        <SPSSODescriptor
            AuthnRequestsSigned="true"
            WantAssertionsSigned="true"
            protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

            <KeyDescriptor use="signing">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${helpers_1.normalizeCertificate(options.signature.certificate)}</X509Certificate>
                    </X509Data>
                </KeyInfo>
            </KeyDescriptor>

            <KeyDescriptor use="encryption">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${helpers_1.normalizeCertificate(options.signature.certificate)}</X509Certificate>
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
    </EntityDescriptor>`;
const getLoginXML = (id, options) => `<samlp:AuthnRequest
            AssertionConsumerServiceURL="${options.sp.assertionUrl}"
            Destination="${options.idp.loginUrl}"
            ID="${'_' + id}"
            IssueInstant="${new Date().toISOString()}"
            ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Version="2.0"
            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
            xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Issuer>${options.sp.id}</saml:Issuer>
        <samlp:NameIDPolicy AllowCreate="false" Format="${options.nameIdFormat}"/>
    </samlp:AuthnRequest>`.replace(/>\n */g, '>'); // Remove formatting to make sure it does not the redirect request
//# sourceMappingURL=service-provider.js.map