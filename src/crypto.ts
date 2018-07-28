import { SignedXml } from 'xml-crypto'
import { DOMParser } from 'xmldom'
import { toPEM, toX059 } from './helpers/certificate'
import * as xpath from 'xpath'
import * as XmlEncryption from 'xml-encryption'

const algorithmMapping = {
    sha1: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha1',
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
    algorithm: 'sha256' | 'sha512' | 'sha1'
    allowedCertificates: string[]
}

export function checkSignature(xmlToCheck: string, options: CheckSignatureOptions) {
    const { algorithm, allowedCertificates } = options

    const document = new DOMParser().parseFromString(xmlToCheck)
    const signatures = xpath.select("//*[local-name(.)='Signature']", document)

    if (!Array.isArray(signatures)) throw new Error('Invalid Signature: xpath should return an array')
    if (signatures.length === 0) throw new Error('No signature')

    // TODO check how risky this is?
    xmlToCheck = xmlToCheck.replace(/<ds:Signature(.*?)>(.*?)<\/(.*?)ds:Signature>/g, '')

    const crypto = new SignedXml()

    signatures.forEach(signature => {
        crypto.signatureAlgorithm = algorithmMapping[algorithm]

        const givenCertificate = xpath.select(".//*[local-name(.)='X509Certificate']", signature)[0].firstChild.data
        const normalizedCertificate = toX059(givenCertificate)

        if (!allowedCertificates.includes(normalizedCertificate)) throw new Error('Certificate is not allowed')

        crypto.keyInfoProvider = new KeyInformationProvider(normalizedCertificate)

        crypto.loadSignature(signature)
        if (!crypto.checkSignature(xmlToCheck)) throw new Error('One of the provided signatures is not valid')
    })
}

export async function decryptXML(xmlToDecrypt: string, key: string) {
    const document = new DOMParser().parseFromString(xmlToDecrypt)
    const encryptedAssertions = xpath.select("//*[local-name(.)='EncryptedAssertion']", document)

    // XML does not seem to be encrypted so we return early with the "decrypted" content
    // We might want to update this at some point to error if the metadata file tells us the assertion
    // should be encrypted.
    if (!Array.isArray(encryptedAssertions) || encryptedAssertions.length === 0) return xmlToDecrypt

    for (const encryptedAssertion of encryptedAssertions) {
        const assertion = await decryptPromise(encryptedAssertion, key)

        // Replace the encrypted node by the decrypted one
        const assertionNode = new DOMParser().parseFromString(assertion)
        document.replaceChild(assertionNode, encryptedAssertion)
    }

    return document.toString()
}

function decryptPromise(encryptedAssertion: string, key: string) {
    return new Promise<string>((resolve, reject) => {
        XmlEncryption.decrypt(encryptedAssertion, { key }, (error, assertion) => {
            if (error) return reject(error)
            if (!assertion) return reject(new Error('Decrypted assertion is empty'))
            resolve(assertion)
        })
    })
}

// This is used by the xml-crypto library. Docs can be found here:
// https://github.com/yaronn/xml-crypto#customizing-algorithms
// It allows us to generate the tags as we want them for the certificate
class KeyInformationProvider {
    constructor(private certificate: string) {}

    public getKeyInfo() {
        const normalizedCert = toX059(this.certificate)
        return `<ds:X509Data><ds:X509Certificate>${normalizedCert}</ds:X509Certificate></ds:X509Data>`
    }

    public getKey() {
        return toPEM(this.certificate)
    }
}
