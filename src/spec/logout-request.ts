import { assert } from 'chai'
import logoutRequestXML from './resources/assertions/logout-request.xml'
import signedLogoutRequestXML from './resources/assertions/signed-logout-request.xml'
import { extract } from '../logout-request'

describe('LogoutRequest.extract', function() {
    const expected = {
        destination: 'http://idp.example.com/SingleLogoutService.php',
        id: 'IDP_21df91a89767879fc0f7df6a1490c6000c81644d',
        issueInstant: '2014-07-18T01:13:06Z',
        issuer: 'http://sp.example.com/demo1/metadata.php',
        names: ['IDP_f92cc1834efc0f73e9c09f482fce80037a6251e7']
    }

    it('should extract data from a unsigned logout request', async function() {
        const result = await extract(logoutRequestXML())
        assert.deepEqual(result, expected)
    })

    it('should extract data from a signed logout request', async function() {
        const result = await extract(signedLogoutRequestXML())
        assert.deepEqual(result, expected)
    })
})
