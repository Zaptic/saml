import * as fs from 'fs'
import * as path from 'path'
import { assert } from 'chai'
import signedAssertion from './resources/responses/signed-assertion.xml'
import { checkSignature, decryptXML } from '../crypto'

describe('Crypto.checkSignature', function() {
    // This is the certificate the assertions were signed with
    const allowedCertificate =
        'MIICajCCAdOgAwIBAgIBADANBgkqhkiG9w0BAQ0FADBSMQswCQYDVQQGEwJ1czETMBEGA1UECAwKQ2FsaWZvcm5pYT' +
        'EVMBMGA1UECgwMT25lbG9naW4gSW5jMRcwFQYDVQQDDA5zcC5leGFtcGxlLmNvbTAeFw0xNDA3MTcxNDEyNTZaFw0x' +
        'NTA3MTcxNDEyNTZaMFIxCzAJBgNVBAYTAnVzMRMwEQYDVQQIDApDYWxpZm9ybmlhMRUwEwYDVQQKDAxPbmVsb2dpbi' +
        'BJbmMxFzAVBgNVBAMMDnNwLmV4YW1wbGUuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDZx+ON4IUoIWxg' +
        'ukTb1tOiX3bMYzYQiwWPUNMp+Fq82xoNogso2bykZG0yiJm5o8zv/sd6pGouayMgkx/2FSOdc36T0jGbCHuRSbtia0' +
        'PEzNIRtmViMrt3AeoWBidRXmZsxCNLwgIV6dn2WpuE5Az0bHgpZnQxTKFek0BMKU/d8wIDAQABo1AwTjAdBgNVHQ4E' +
        'FgQUGHxYqZYyX7cTxKVODVgZwSTdCnwwHwYDVR0jBBgwFoAUGHxYqZYyX7cTxKVODVgZwSTdCnwwDAYDVR0TBAUwAw' +
        'EB/zANBgkqhkiG9w0BAQ0FAAOBgQByFOl+hMFICbd3DJfnp2Rgd/dqttsZG/tyhILWvErbio/DEe98mXpowhTkC04E' +
        'NprOyXi7ZbUqiicF89uAGyt1oqgTUCD1VsLahqIcmrzgumNyTwLGWo17WDAa1/usDhetWAMhgzF/Cnf5ek0nK00m0Y' +
        'ZGyc4LzgD0CROMASTWNg=='

    const validOptions = { allowedCertificates: [allowedCertificate], algorithm: <'sha1'>'sha1' }

    it('should should not throw when validating a correctly signed assertion', async function() {
        assert.doesNotThrow(() => checkSignature(signedAssertion(), validOptions))
    })

    it('should throw an error when the signing certificate does not match an allowed certificate', async function() {
        const expectedError = 'Certificate is not allowed'

        // Throws when there are not allowed certs
        assert.throws(
            () => checkSignature(signedAssertion(), { allowedCertificates: [], algorithm: 'sha1' }),
            expectedError
        )

        // Throws when the cert does not match the allowed ones
        assert.throws(
            () =>
                checkSignature(signedAssertion(), {
                    allowedCertificates: [allowedCertificate + 'a'],
                    algorithm: 'sha1'
                }),
            expectedError
        )
    })

    it('should throw an error when the assertion has been tempered with', async function() {
        // Change one of the dates in the assertion
        const assertion = signedAssertion().replace('2014-07-17T01:01:18Z', new Date().toISOString())

        assert.throws(() => checkSignature(assertion, validOptions), 'One of the provided signatures is not valid')
    })

    it('should throw an error when there is no signature', async function() {
        // Change one of the dates in the assertion
        const assertion = signedAssertion().replace(/<ds:Signature(.|\n)*<\/ds:Signature>/gm, '')

        assert.throws(() => checkSignature(assertion, validOptions), 'No signature')
    })
})

describe('Crypto.decryptXML', function() {
    const testKey = fs.readFileSync(path.resolve('./src/spec/resources/key.pem'), 'utf8')

    it('should should change the content of an request that is not encrypted', async function() {
        const result = await decryptXML(signedAssertion(), testKey)
        assert.equal(result, signedAssertion())
    })
})
