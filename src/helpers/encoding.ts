import * as zlib from 'zlib'
import * as querystring from 'querystring'

export function decodePostResponse(message: string) {
    return Buffer.from(message, 'base64').toString('utf8')
}

// See https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf 3.4.4.1 DEFLATE Encoding
// TLDR: xml -> deflate -> base64 -> encodeURI
// NB: querystring does the uri encoding
export function encodeRedirectParameters(xml: string, RelayState?: string) {
    return new Promise((resolve, reject) => {
        zlib.deflateRaw(Buffer.from(xml), (error, deflatedMessage) => {
            if (error) return reject(error)

            const SAMLRequest = deflatedMessage.toString('base64')
            const params = RelayState
                ? querystring.stringify({ SAMLRequest, RelayState })
                : querystring.stringify({ SAMLRequest })

            resolve(params)
        })
    })
}

// See https://docs.oasis-open.org/security/saml/v2.0/saml-bindings-2.0-os.pdf 3.5.4 Message Encoding
// TLDR: xml -> base64 -> application/x-www-form-urlencoded
// NB: This does not handle the final step of form encoding.
//     The consumer should insert the data into html form fields and submit.
export function encodePostFormFields(xml: string, RelayState?: string) {
    const SAMLRequest = Buffer.from(xml).toString('base64')
    return RelayState ? { SAMLRequest, RelayState } : { SAMLRequest }
}
