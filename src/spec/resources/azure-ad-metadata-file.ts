export default () =>
    `
<EntityDescriptor
    ID="_7a1e7134-1822-4f88-a294-5cfb571c333f"
    entityID="https://sts.windows.net/id/"
>
    <Signature>
        <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
            <Reference URI="#_7a1e7134-1822-4f88-a294-5cfb571c333f">
                <Transforms>
                    <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
                    <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
                </Transforms>
                <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                <DigestValue>Digest</DigestValue>
            </Reference>
        </SignedInfo>
        <SignatureValue>
            SignValue
        </SignatureValue>
        <KeyInfo>
            <X509Data>
                <X509Certificate>
                    UsedSignCert
                </X509Certificate>
            </X509Data>
        </KeyInfo>
    </Signature>
    <RoleDescriptor
        xsi:type="fed:SecurityTokenServiceType"
        protocolSupportEnumeration="http://docs.oasis-open.org/wsfed/federation/200706"
    >
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert11
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert12
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert13
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <fed:ClaimTypesOffered>
            <auth:ClaimType Uri="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name">
                <auth:DisplayName>Name</auth:DisplayName>
                <auth:Description>The mutable display name of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier">
                <auth:DisplayName>Subject</auth:DisplayName>
                <auth:Description>
                    An immutable, globally unique non-reusable identifier of the user that is unique to the application
                    for which a token is issued.
                </auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname">
                <auth:DisplayName>Given Name</auth:DisplayName>
                <auth:Description>First name of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname">
                <auth:DisplayName>Surname</auth:DisplayName>
                <auth:Description>Last name of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/displayname">
                <auth:DisplayName>Display Name</auth:DisplayName>
                <auth:Description>Display name of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/nickname">
                <auth:DisplayName>Nick Name</auth:DisplayName>
                <auth:Description>Nick name of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationinstant">
                <auth:DisplayName>Authentication Instant</auth:DisplayName>
                <auth:Description>
                    The time (UTC) when the user is authenticated to Windows Azure Active Directory.
                </auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/authenticationmethod">
                <auth:DisplayName>Authentication Method</auth:DisplayName>
                <auth:Description>
                    The method that Windows Azure Active Directory uses to authenticate users.
                </auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/objectidentifier">
                <auth:DisplayName>ObjectIdentifier</auth:DisplayName>
                <auth:Description>
                    Primary identifier for the user in the directory. Immutable, globally unique, non-reusable.
                </auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/tenantid">
                <auth:DisplayName>TenantId</auth:DisplayName>
                <auth:Description>Identifier for the user's tenant.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/identityprovider">
                <auth:DisplayName>IdentityProvider</auth:DisplayName>
                <auth:Description>Identity provider for the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
                <auth:DisplayName>Email</auth:DisplayName>
                <auth:Description>Email address of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/groups">
                <auth:DisplayName>Groups</auth:DisplayName>
                <auth:Description>Groups of the user.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/accesstoken">
                <auth:DisplayName>External Access Token</auth:DisplayName>
                <auth:Description>Access token issued by external identity provider.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/expiration">
                <auth:DisplayName>External Access Token Expiration</auth:DisplayName>
                <auth:Description>
                    UTC expiration time of access token issued by external identity provider.
                </auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/identity/claims/openid2_id">
                <auth:DisplayName>External OpenID 2.0 Identifier</auth:DisplayName>
                <auth:Description>OpenID 2.0 identifier issued by external identity provider.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/claims/groups.link">
                <auth:DisplayName>GroupsOverageClaim</auth:DisplayName>
                <auth:Description>Issued when number of user's group claims exceeds return limit.</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/role">
                <auth:DisplayName>Role Claim</auth:DisplayName>
                <auth:Description>Roles that the user or Service Principal is attached to</auth:Description>
            </auth:ClaimType>
            <auth:ClaimType Uri="http://schemas.microsoft.com/ws/2008/06/identity/claims/wids">
                <auth:DisplayName>RoleTemplate Id Claim</auth:DisplayName>
                <auth:Description>
                    Role template id of the Built-in Directory Roles that the user is a member of
                </auth:Description>
            </auth:ClaimType>
        </fed:ClaimTypesOffered>
        <fed:SecurityTokenServiceEndpoint>
            <wsa:EndpointReference>
                <wsa:Address>https://login.microsoftonline.com/id/wsfed</wsa:Address>
            </wsa:EndpointReference>
        </fed:SecurityTokenServiceEndpoint>
        <fed:PassiveRequestorEndpoint>
            <wsa:EndpointReference>
                <wsa:Address>https://login.microsoftonline.com/id/wsfed</wsa:Address>
            </wsa:EndpointReference>
        </fed:PassiveRequestorEndpoint>
    </RoleDescriptor>
    <RoleDescriptor
        xsi:type="fed:ApplicationServiceType"
        protocolSupportEnumeration="http://docs.oasis-open.org/wsfed/federation/200706"
    >
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert21
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert22
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert23
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <fed:TargetScopes>
            <wsa:EndpointReference>
                <wsa:Address>https://sts.windows.net/id/</wsa:Address>
            </wsa:EndpointReference>
        </fed:TargetScopes>
        <fed:ApplicationServiceEndpoint>
            <wsa:EndpointReference>
                <wsa:Address>https://login.microsoftonline.com/id/wsfed</wsa:Address>
            </wsa:EndpointReference>
        </fed:ApplicationServiceEndpoint>
        <fed:PassiveRequestorEndpoint>
            <wsa:EndpointReference>
                <wsa:Address>https://login.microsoftonline.com/id/wsfed</wsa:Address>
            </wsa:EndpointReference>
        </fed:PassiveRequestorEndpoint>
    </RoleDescriptor>
    <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert31
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert32
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <KeyDescriptor use="signing">
            <KeyInfo>
                <X509Data>
                    <X509Certificate>
                        SignCert33
                    </X509Certificate>
                </X509Data>
            </KeyInfo>
        </KeyDescriptor>
        <SingleLogoutService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="https://login.microsoftonline.com/id/saml2"
        />
        <SingleSignOnService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            Location="https://login.microsoftonline.com/id/saml2"
        />
        <SingleSignOnService
            Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Location="https://login.microsoftonline.com/id/saml2"
        />
    </IDPSSODescriptor>
</EntityDescriptor>
`
        .replace(/\n */g, ' ')
        .replace(/> /g, '>')
        .replace(/ </g, '<')
