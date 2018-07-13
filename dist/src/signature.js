"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xml_crypto_1 = require("xml-crypto");
const xmldom_1 = require("xmldom");
const helpers_1 = require("./helpers");
const xpath = require("xpath");
const algorithmMapping = {
    sha256: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    sha512: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512'
};
const digestMapping = {
    sha256: 'http://www.w3.org/2001/04/xmlenc#sha256',
    sha512: 'http://www.w3.org/2001/04/xmlenc#sha512'
};
function signXML(xmlToSign, options) {
    const crypto = new xml_crypto_1.SignedXml();
    // Add the reference
    crypto.addReference('/*', ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'], digestMapping[options.algorithm]);
    crypto.signatureAlgorithm = algorithmMapping[options.algorithm];
    crypto.keyInfoProvider = new KeyInformationProvider(options.certificate);
    crypto.signingKey = options.key;
    crypto.computeSignature(xmlToSign, {
        prefix: 'ds',
        location: { reference: '/samlp:AuthnRequest/saml:Issuer', action: 'after' }
    });
    return crypto.getSignedXml();
}
exports.signXML = signXML;
function checkSignature(xmlToCheck, options) {
    const { certificate, algorithm, allowedCertificates } = options;
    const document = new xmldom_1.DOMParser().parseFromString(xmlToCheck);
    const signatures = xpath.select("//*[local-name(.)='Signature']", document);
    if (signatures.length === 0)
        throw new Error('No signature');
    // TODO check how risky this is?
    xmlToCheck = xmlToCheck.replace(/<ds:Signature(.*?)>(.*?)<\/(.*?)ds:Signature>/g, '');
    const crypto = new xml_crypto_1.SignedXml();
    signatures.forEach(signature => {
        crypto.signatureAlgorithm = algorithmMapping[algorithm];
        if (certificate)
            crypto.keyInfoProvider = new KeyInformationProvider(certificate);
        else {
            const givenCertificate = xpath.select(".//*[local-name(.)='X509Certificate']", signature)[0].firstChild.data;
            const normalizedCertificate = helpers_1.normalizeCertificate(givenCertificate);
            if (allowedCertificates.includes(normalizedCertificate))
                throw new Error('Certificate is not allowed');
            crypto.keyInfoProvider = new KeyInformationProvider(normalizedCertificate);
        }
        crypto.loadSignature(signature);
        if (!crypto.checkSignature(xmlToCheck))
            throw new Error('One of the provided signatures is not valid');
    });
}
exports.checkSignature = checkSignature;
// This is used by the xml-crypto library. Docs can be found here:
// https://github.com/yaronn/xml-crypto#customizing-algorithms
// It allows us to generate the tags as we want them for the certificate
class KeyInformationProvider {
    constructor(certificate) {
        this.certificate = certificate;
    }
    getKeyInfo() {
        const normalizedCert = helpers_1.normalizeCertificate(this.certificate);
        return `<ds:X509Data><ds:X509Certificate>${normalizedCert}</ds:X509Certificate></ds:X509Data>`;
    }
    getKey() {
        return this.certificate;
    }
}
//# sourceMappingURL=signature.js.map