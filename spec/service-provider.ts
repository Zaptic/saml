import * as fs from 'fs'
import * as path from 'path'
import { assert } from 'chai'
import SAMLProvider from '../src/service-provider'
import * as querystring from 'querystring'
import { fromBase64 } from '../src/helpers'
import * as xsd from 'libxml-xsd'

const testCert = fs.readFileSync(path.resolve('./spec/resources/cert.pem'), 'utf8')
const testKey = fs.readFileSync(path.resolve('./spec/resources/key.pem'), 'utf8')

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

        await validateSchema(await provider.metadataShema!, metadata)
    })

    it('should generate a valid login request', async function() {
        const provider = new SAMLProvider(options)
        await provider.init()

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)
        const parts = redirectURL.split('?')

        assert.equal(parts[0], options.idp.loginUrl, 'Login url must be the one provided in the options')

        const { SAMLRequest, RelayState } = querystring.parse(parts[1])

        assert.equal(RelayState, relayState, 'Relay states do not match')
        assert.isDefined(SAMLRequest, 'Query should have a SAMLRequest attribute')

        const request = fromBase64(<string>SAMLRequest)

        await validateSchema(await provider.protocolSchema!, request)
    })
})
