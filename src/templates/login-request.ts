type Options = {
    serviceProviderId: string
    assertionUrl: string
    loginUrl: string
    forceAuthentication: boolean
}

export default (requestId: string, options: Options) =>
    `<samlp:AuthnRequest
            AssertionConsumerServiceURL="${options.assertionUrl}"
            Destination="${options.loginUrl}"
            ID="${'_' + requestId}"
            IssueInstant="${new Date().toISOString()}"
            ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Version="2.0"
            ForceAuthn="${options.forceAuthentication}"
            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
            xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Issuer>${options.serviceProviderId}</saml:Issuer>
    </samlp:AuthnRequest>`
        .replace(/>\n */g, '>')
        .replace(/\n\s*/g, ' ')
