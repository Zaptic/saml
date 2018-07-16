import * as zlib from 'zlib'
import * as querystring from 'querystring'

const BEGIN_CERT = '-----BEGIN CERTIFICATE-----'
const END_CERT = '-----END CERTIFICATE-----'

// This turns a .pem file into a one line string that we can put in an xml tag
export function toX059(certificate: string) {
    return certificate
        .toString()
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(BEGIN_CERT, '')
        .replace(END_CERT, '')
        .replace(/ /g, '')
}

export function toPEM(certificate: string) {
    const parts = certificate.match(/.{1,64}/g)
    if (!parts) throw new Error('Invalid certificate')
    return BEGIN_CERT + '\n' + parts.join('\n') + '\n' + END_CERT
}

export function fromBase64(message: string) {
    return new Buffer(message, 'base64').toString('utf8')
}

// See https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf 3.4.4.1 DEFLATE Encoding
// TLDR: xml -> deflate -> base64 -> encodeURI
// NB: querystring does the uri encoding
export function encodeRedirectParameters(xml: string, RelayState?: string) {
    return new Promise((resolve, reject) => {
        zlib.deflateRaw(new Buffer(xml), (error, deflatedMessage) => {
            if (error) return reject(error)

            const SAMLRequest = deflatedMessage.toString('base64')
            const params = RelayState
                ? querystring.stringify({ SAMLRequest, RelayState })
                : querystring.stringify({ SAMLRequest })

            resolve(params)
        })
    })
}
