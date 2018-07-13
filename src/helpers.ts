// This turns a .pem file into a one line string that we can put in an xml tag
export function normalizeCertificate(certificate: string) {
    return certificate
        .toString()
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(`-----BEGIN CERTIFICATE-----`, '')
        .replace(`-----END CERTIFICATE-----`, '')
        .replace(/ /g, '')
}

export function toBase64(message: string) {
    return new Buffer(message).toString('base64')
}

export function fromBase64(message: string) {
    return new Buffer(message, 'base64').toString('utf8')
}
