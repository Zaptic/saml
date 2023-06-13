import * as fs from 'fs'
import * as path from 'path'
import { assert } from 'chai'
import SAMLProvider from '../service-provider'
import * as querystring from 'querystring'
import * as zlib from 'zlib'
import { Validator } from '../helpers/xml'

const testCert = fs.readFileSync(path.resolve('./src/spec/resources/cert.pem'), 'utf8')
const testKey = fs.readFileSync(path.resolve('./src/spec/resources/key.pem'), 'utf8')

describe('SAMLProvider', function() {
    const options = {
        sp: {
            id: 'test-sp',
            assertionUrl: 'http://localhost:7000/sp/login',
            singleLogoutUrl: 'http://localhost:7000/sp/logout',
            signature: [
                {
                    algorithm: <'sha256'>'sha256',
                    certificate: 'MIIE/EXPIRED/Q==',
                    notAfter: new Date(Date.now() - 100000),
                    key: testKey
                },
                {
                    algorithm: <'sha256'>'sha256',
                    certificate: testCert,
                    notAfter: new Date(Date.now() + 100000),
                    key: testKey
                }
            ]
        },
        idp: {
            id: 'test-idp',
            redirectLoginUrl: 'http://localhost:7000/idp/requestLogin',
            postLoginUrl: 'http://localhost:7000/idp/requestLogin',
            signature: {
                certificate: testCert,
                algorithm: <'sha256'>'sha256',
                allowedCertificates: []
            }
        },
        getUUID: () => 'test-uuid'
    }

    function checkSamlRequest(samlRequest: string, signed: boolean, validator: Validator) {
        // Ths is naive but should be enough for now
        if (signed) {
            assert.include(samlRequest, 'Signature', 'Request should be signed')
        } else {
            assert.notInclude(samlRequest, 'Signature', 'Request should not signed')
        }

        return validator(samlRequest)
    }

    function checkRedirectURL(redirectURL: string, relayState: string, signed: boolean, validator: Validator) {
        const parts = redirectURL.split('?')
        assert.equal(parts[0], options.idp.redirectLoginUrl, 'Login url must be the one provided in the options')

        const { SAMLRequest, RelayState } = querystring.parse(parts[1])

        assert.equal(RelayState, relayState, 'Relay states do not match')
        assert.isDefined(SAMLRequest, 'Query should have a SAMLRequest attribute')

        const request = zlib.inflateRawSync(new Buffer(<string>SAMLRequest, 'base64')).toString('utf8')

        return checkSamlRequest(request, signed, validator)
    }

    function checkPostFormData(data: any, relayState: string, signed: boolean, validator: Validator) {
        assert.equal(data.action, options.idp.redirectLoginUrl)
        assert.equal(data.fields.RelayState, relayState)

        const request = Buffer.from(data.fields.SAMLRequest, 'base64').toString()
        return checkSamlRequest(request, signed, validator)
    }

    it('should generate valid metadata', async function() {
        const provider = await SAMLProvider.create(options)

        const metadata = provider.getMetadata()

        await provider.XSDs.metadata!(metadata)
    })

    it('should generate a valid signed login request', async function() {
        const provider = await SAMLProvider.create(options)

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)
        const postFormData = await provider.buildLoginRequestPostFormData(relayState)

        await checkRedirectURL(redirectURL, relayState, true, provider.XSDs.protocol)
        await checkPostFormData(postFormData, relayState, true, provider.XSDs.protocol)
    })

    it('should generate valid redirect urls for identity provider that use query params ', async function() {
        const redirectLoginUrl = 'http://localhost:7000/idp/requestLogin?param=true'
        // Add a parameter to the login url
        const opts = {
            ...options,
            idp: { ...options.idp, redirectLoginUrl }
        }
        const provider = await SAMLProvider.create(opts)

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)

        // We just make sure that the url is build properly, the other tests will check the data
        redirectURL.startsWith(redirectLoginUrl + '&')
    })

    it('should generate a valid signed login request with ForceAuthn set to true', async function() {
        const provider = await SAMLProvider.create(options)

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState, true)
        const postFormData = await provider.buildLoginRequestPostFormData(relayState, true)

        await checkRedirectURL(redirectURL, relayState, true, provider.XSDs.protocol)
        await checkPostFormData(postFormData, relayState, true, provider.XSDs.protocol)
    })

    it('should generate a valid non-signed login request', async function() {
        const provider = await SAMLProvider.create({ ...options, preferences: { signLoginRequests: false } })

        const relayState = 'someState'
        const redirectURL = await provider.buildLoginRequestRedirectURL(relayState)
        const postFormData = await provider.buildLoginRequestPostFormData(relayState)

        await checkRedirectURL(redirectURL, relayState, false, provider.XSDs.protocol)
        await checkPostFormData(postFormData, relayState, false, provider.XSDs.protocol)
    })
})
