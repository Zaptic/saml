import { toX059 } from '../helpers/certificate'

type Options = { id: string; signature: { certificate: string }; singleLogoutUrl: string; assertionUrl: string }

export default (options: Options, nameIdFormat: string) =>
    `<EntityDescriptor
        xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
        entityID="${options.id}">

        <SPSSODescriptor
            AuthnRequestsSigned="true"
            WantAssertionsSigned="true"
            protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">

            <KeyDescriptor use="signing">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${toX059(options.signature.certificate)}</X509Certificate>
                    </X509Data>
                </KeyInfo>
            </KeyDescriptor>

            <KeyDescriptor use="encryption">
                <KeyInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
                    <X509Data>
                        <X509Certificate>${toX059(options.signature.certificate)}</X509Certificate>
                    </X509Data>
                </KeyInfo>

            </KeyDescriptor>

            <SingleLogoutService
                Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                Location="${options.singleLogoutUrl}"/>

            <NameIDFormat>${nameIdFormat}</NameIDFormat>

            <AssertionConsumerService
                Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                Location="${options.assertionUrl}"
                index="1"/>

        </SPSSODescriptor>
    </EntityDescriptor>`
