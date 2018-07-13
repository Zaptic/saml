"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function checkTime(notBefore, notOnOrAfter, strict = false) {
    const now = Date.now();
    if (strict && (notBefore === undefined || notOnOrAfter === undefined))
        return false;
    return ((notBefore === undefined || notBefore.getTime() <= now) &&
        (notOnOrAfter === undefined || notOnOrAfter.getTime() > now));
}
exports.checkTime = checkTime;
function checkStatusCode(status) {
    const permissibleStatus = [
        'urn:oasis:names:tc:SAML:2.0:status:Success',
        'urn:oasis:names:tc:SAML:2.0:status:Requester',
        'urn:oasis:names:tc:SAML:2.0:status:Responder',
        'urn:oasis:names:tc:SAML:2.0:status:VersionMismatch'
    ];
    return permissibleStatus.includes(status);
}
exports.checkStatusCode = checkStatusCode;
//# sourceMappingURL=checks.js.map