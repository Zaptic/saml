import { SignedXml } from 'xml-crypto'
import { DOMParser } from 'xmldom'
import { normalizeCertificate } from './helpers'
import * as xpath from 'xpath'

const algorithmMapping = {
    sha256: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    sha512: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512'
}

const digestMapping = {
    sha256: 'http://www.w3.org/2001/04/xmlenc#sha256',
    sha512: 'http://www.w3.org/2001/04/xmlenc#sha512'
}

export function signXML(
    xmlToSign: string,
    options: {
        certificate: string
        key: string
        algorithm: 'sha256' | 'sha512'
    }
) {
    const crypto = new SignedXml()

    // Add the reference
    crypto.addReference(
        '/*',
        ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
        digestMapping[options.algorithm]
    )
    crypto.signatureAlgorithm = algorithmMapping[options.algorithm]
    crypto.keyInfoProvider = new KeyInformationProvider(options.certificate)
    crypto.signingKey = options.key
    crypto.computeSignature(xmlToSign, {
        prefix: 'ds',
        location: { reference: '/samlp:AuthnRequest/saml:Issuer', action: <'after'>'after' }
    })

    return crypto.getSignedXml()
}

export type CheckSignatureOptions = {
    certificate: string
    algorithm: 'sha256' | 'sha512'
    allowedCertificates: string[]
}

export function checkSignature(xmlToCheck: string, options: CheckSignatureOptions) {
    const { certificate, algorithm, allowedCertificates } = options

    const document = new DOMParser().parseFromString(xmlToCheck)
    const signatures = xpath.select("//*[local-name(.)='Signature']", document)

    if (signatures.length === 0) throw new Error('No signature')

    // TODO check how risky this is?
    xmlToCheck = xmlToCheck.replace(/<ds:Signature(.*?)>(.*?)<\/(.*?)ds:Signature>/g, '')

    const crypto = new SignedXml()

    signatures.forEach(signature => {
        crypto.signatureAlgorithm = algorithmMapping[algorithm]

        if (certificate) crypto.keyInfoProvider = new KeyInformationProvider(certificate)
        else {
            const givenCertificate = xpath.select(".//*[local-name(.)='X509Certificate']", signature)[0].firstChild.data
            const normalizedCertificate = normalizeCertificate(givenCertificate)

            if (!allowedCertificates.includes(normalizedCertificate)) throw new Error('Certificate is not allowed')

            crypto.keyInfoProvider = new KeyInformationProvider(normalizedCertificate)
        }

        crypto.loadSignature(signature)
        if (!crypto.checkSignature(xmlToCheck)) throw new Error('One of the provided signatures is not valid')
    })
}

// This is used by the xml-crypto library. Docs can be found here:
// https://github.com/yaronn/xml-crypto#customizing-algorithms
// It allows us to generate the tags as we want them for the certificate
class KeyInformationProvider {
    constructor(private certificate: string) {}

    public getKeyInfo() {
        const normalizedCert = normalizeCertificate(this.certificate)
        return `<ds:X509Data><ds:X509Certificate>${normalizedCert}</ds:X509Certificate></ds:X509Data>`
    }

    public getKey() {
        return this.certificate
    }
}
