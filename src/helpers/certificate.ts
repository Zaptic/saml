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
