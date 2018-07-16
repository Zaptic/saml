import * as fs from 'fs'
import * as path from 'path'
import { assert } from 'chai'
import SAMLProvider from '../service-provider'
import * as querystring from 'querystring'
import * as xsd from 'libxml-xsd'
import * as zlib from 'zlib'

const testCert = fs.readFileSync(path.resolve('./src/spec/resources/cert.pem'), 'utf8')
const testKey = fs.readFileSync(path.resolve('./src/spec/resources/key.pem'), 'utf8')

function validateSchema(schema: { validate: xsd.ValidateFunction }, xml: string) {
    return new Promise(resolve => {
        schema.validate(xml, (technicalErrors, validationErrors) => {
            assert.isNull(technicalErrors, `Technical errors: ${technicalErrors}`)
            assert.isNull(validationErrors, `Validation errors: ${validationErrors}`)
            resolve()
        })
    })
}

describe('SAMLProvider', function() {
    const options = {
        sp: {
            id: 'test-sp',
            assertionUrl: 'http://localhost:7000/sp/login',
            singleLogoutUrl: 'http://localhost:7000/sp/logout',
            signature: {
                algorithm: <'sha256'>'sha256',
                certificate: testCert,
                key: testKey
            }
        },
        idp: {
            id: 'test-idp',
            loginUrl: 'http://localhost:7000/idp/requestLogin',
            signature: {
                certificate: testCert,
                algorithm: <'sha256'>'sha256',
                allowedCertificates: []
            }
        },
        getUUID: () => 'test-uuid'
    }

    it('should generate valid metadata', async function() {
        const provider = new SAMLProvider(options)
        await provider.init()

        const metadata = provider.getMetadata()

        await validateSchema(provider.metadataShema!, metadata)
    })

    it('should generate a valid signed login request', async function() {
        const provider = new SAMLProvider(options)
        await provider.init()

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)
        const parts = redirectURL.split('?')

        assert.equal(parts[0], options.idp.loginUrl, 'Login url must be the one provided in the options')

        const { SAMLRequest, RelayState } = querystring.parse(parts[1])

        assert.equal(RelayState, relayState, 'Relay states do not match')
        assert.isDefined(SAMLRequest, 'Query should have a SAMLRequest attribute')

        const request = zlib.inflateRawSync(new Buffer(<string>SAMLRequest, 'base64')).toString('utf8')

        // Ths is naive but should be enough for now
        assert.include(request, 'Signature', 'Request should be signed')

        await validateSchema(provider.protocolSchema!, request)
    })

    it('should generate a valid non-signed login request', async function() {
        const provider = new SAMLProvider({ ...options, signLoginRequests: false })
        await provider.init()

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)
        const parts = redirectURL.split('?')

        assert.equal(parts[0], options.idp.loginUrl, 'Login url must be the one provided in the options')

        const { SAMLRequest, RelayState } = querystring.parse(parts[1])

        assert.equal(RelayState, relayState, 'Relay states do not match')
        assert.isDefined(SAMLRequest, 'Query should have a SAMLRequest attribute')

        const request = zlib.inflateRawSync(new Buffer(<string>SAMLRequest, 'base64')).toString('utf8')

        // Ths is naive but should be enough for now
        assert.notInclude(request, 'Signature', 'Request should not signed')

        await validateSchema(provider.protocolSchema!, request)
    })
})
