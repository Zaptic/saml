"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This turns a .pem file into a one line string that we can put in an xml tag
function normalizeCertificate(certificate) {
    return certificate
        .toString()
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .replace(`-----BEGIN CERTIFICATE-----`, '')
        .replace(`-----END CERTIFICATE-----`, '')
        .replace(/ /g, '');
}
exports.normalizeCertificate = normalizeCertificate;
function toBase64(message) {
    return new Buffer(message).toString('base64');
}
exports.toBase64 = toBase64;
function fromBase64(message) {
    return new Buffer(message, 'base64').toString('utf8');
}
exports.fromBase64 = fromBase64;
//# sourceMappingURL=helpers.js.map