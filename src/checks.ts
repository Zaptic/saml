export function checkTime(notBefore?: Date, notOnOrAfter?: Date, strict = false): boolean {
    const now = Date.now()

    if (strict && (notBefore === undefined || notOnOrAfter === undefined)) return false

    return (
        (notBefore === undefined || notBefore.getTime() <= now) &&
        (notOnOrAfter === undefined || notOnOrAfter.getTime() > now)
    )
}

export function checkStatusCodes(statuses: string[]) {
    const permissibleStatuses = [
        'urn:oasis:names:tc:SAML:2.0:status:Success',
        'urn:oasis:names:tc:SAML:2.0:status:Requester',
        'urn:oasis:names:tc:SAML:2.0:status:Responder',
        'urn:oasis:names:tc:SAML:2.0:status:VersionMismatch'
    ]

    return statuses.every(status => permissibleStatuses.includes(status))
}
