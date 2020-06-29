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

export interface Certificate {
    certificate: string
    key: string
    notAfter: Date
    algorithm: 'sha256' | 'sha512'
}

export function getNonExpired(certificates: Certificate[]): Certificate {
    const cert = certificates.filter(certificate => certificate.notAfter.getTime() > Date.now())[0]
    if (!cert) throw new Error('No valid certificates found')
    return cert
}
