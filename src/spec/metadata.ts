import { extract } from '../metadata'
import { assert } from 'chai'
import getMetadata from './resources/azure-ad-metadata-file'
import { assertPromiseRejects } from './helpers'

describe('Metadata.extract', function() {
    it('should extract metadata from an Azure AD metadata file', async function() {
        const xml = getMetadata()

        const result = await extract(xml)
        const expected = {
            identityProvider: {
                id: 'https://sts.windows.net/id/',
                signature: {
                    algorithm: 'sha256',
                    allowedCertificates: ['SignCert31', 'SignCert32', 'SignCert33']
                },
                loginUrl: 'https://login.microsoftonline.com/id/saml2'
            }
        }

        assert.deepEqual(result, expected)
    })

    it('should throw an error when IDPSSODescriptor is missing', async function() {
        const xml = getMetadata().replace(/<IDPSSODescriptor.*<\/IDPSSODescriptor>/g, '')
        const expectedError = 'The metadata files does not seem to be from an identity provider'

        await assertPromiseRejects(extract(xml), expectedError)
    })

    it('should throw an error if there are not login urls for the HTTP-Redirect Binding', async function() {
        const xml = getMetadata().replace(
            '<SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" ' +
                'Location="https://login.microsoftonline.com/id/saml2" />',
            ''
        )
        const expectedError = 'No login url found for the HTTP-Redirect binding'

        await assertPromiseRejects(extract(xml), expectedError)
    })

    it('should throw an error are no key descriptors', async function() {
        const xml = getMetadata().replace(
            /<KeyDescriptor use="signing">((?!(<\/KeyDescriptor>)).)*<\/KeyDescriptor>/g,
            ''
        )
        const expectedError = 'No signing certificates found'

        await assertPromiseRejects(extract(xml), expectedError)
    })

    it('should throw an error are no signing key descriptors', async function() {
        const xml = getMetadata().replace(/use="signing"/g, 'use="encryption"')
        const expectedError = 'No signing certificates found'

        await assertPromiseRejects(extract(xml), expectedError)
    })
})
