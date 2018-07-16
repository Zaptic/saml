type Options = {
    sp: { id: string; assertionUrl: string }
    idp: { loginUrl: string }
}

export default (id: string, options: Options) =>
    `<samlp:AuthnRequest
            AssertionConsumerServiceURL="${options.sp.assertionUrl}"
            Destination="${options.idp.loginUrl}"
            ID="${'_' + id}"
            IssueInstant="${new Date().toISOString()}"
            ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            Version="2.0"
            xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
            xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml:Issuer>${options.sp.id}</saml:Issuer>
    </samlp:AuthnRequest>`
        .replace(/>\n */g, '>')
        .replace(/\n\s*/g, ' ')
