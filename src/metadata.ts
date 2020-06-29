import { KeyInfo, Signature } from './helpers/saml-types'
import { parseXML } from './helpers/xml'

export namespace SAMLMetadata {
    export interface Root {
        $: {
            ID: string
            entityID: string // Use as idp ID
        }
        Signature: Signature[]
        IDPSSODescriptor: {
            $: { protocolSupportEnumeration: string } // Check if it matches urn:oasis:names:tc:SAML:2.0:protocol
            KeyDescriptor: {
                $: { use: 'signing' | 'encryption' }
                KeyInfo: [KeyInfo] // Use to get the signing keys - min/max occurs are 1 on the xsd
            }[]
            SingleLogoutService: Service[]
            // Check that is has urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect and use that url
            SingleSignOnService: Service[]
        }[]
    }

    export interface Service {
        $: { Binding: string; Location: string }
    }
}

interface Metadata {
    identityProvider: {
        id: string
        signature: {
            allowedCertificates: string[]
            algorithm: 'sha256' | 'sha512'
        }
        loginUrl: string
    }
}

export async function extract(xml: string): Promise<Metadata> {
    const json = await parseXML<SAMLMetadata.Root>(xml)

    if (!json.IDPSSODescriptor) throw new Error('The metadata files does not seem to be from an identity provider')

    const identityProviders = json.IDPSSODescriptor.map(idpDescriptor => {
        if (!idpDescriptor.KeyDescriptor) throw new Error('No signing certificates found')

        return {
            id: json.$.entityID,
            signature: {
                algorithm: <'sha256'>'sha256', // Default for now
                allowedCertificates: idpDescriptor.KeyDescriptor.filter(
                    keyDescriptor => keyDescriptor.$.use === 'signing'
                ).map(keyDescriptor =>
                    keyDescriptor.KeyInfo[0].X509Data[0].X509Certificate[0]._.replace(/(\n|\s)*/g, '')
                )
            },

            loginUrl: idpDescriptor.SingleSignOnService.filter(
                service => service.$.Binding === 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect'
            ).map(service => service.$.Location)[0]
        }
    })

    // We only support one idp for the moment
    const identityProvider = identityProviders[0]

    if (!identityProvider.loginUrl) throw new Error('No login url found for the HTTP-Redirect binding')
    if (identityProvider.signature.allowedCertificates.length === 0) throw new Error('No signing certificates found')

    return { identityProvider }
}
