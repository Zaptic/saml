[![Known Vulnerabilities](https://snyk.io/test/github/Zaptic/saml/badge.svg?targetFile=package.json)](https://snyk.io/test/github/Zaptic/saml?targetFile=package.json)

# Simple, secure SAML service provider

This library provides with a simple and secure SAML service provider.

## Options

The options object has 4 top level components:
`sp`, `idp`, `preferences` and `getUUID`

### The `sp` property

It should contain all configuration tied to the service provider.
These options will be used to generate the service provider metadata file and populate the login requests.

`sp.id`  
A globally unique identifier that identifies your service provider. This corresponds to the entityId saml field.
It is often a URL as they make it easy to namespace things so long as you own the domain.
If your id might contain numbers the saml spec says that the id should start with an "\_".

`sp.assertionUrl`  
URL that will receive a POST request containing an assertion - usually login response - from the identity provider.

`sp.singleLogoutUrl`  
URL that will receive single log out requests from the identity provider.
At this time this library does not provide with a way to parse logout requests but it's an open issue.

`sp.signature`  
The `signature` object see relevant section.

`sp.encryption` - optional  
This is also a `signature` object but the certificates provided in this one are for encrypting the login responses.  
When nothing is provided it defaults to the signing certificates under the `sp.signature` object.

### The `idp` property

It should be either an object or string.
If it's a string, it should be a string containing the identity provider's metadata xml.
It is recommended that you use the metadata file as it's easier to maintain than the manually assigned properties.

`idp.id`  
A globally unique identifier that identifies the identity provider. This corresponds to the entityId saml field.
Same restrictions as for the sp id apply.

`idp.loginRedirectUrl`  
The url that we should send auth requests using the HTTP-Redirect binding to

`idp.loginPostUrl`  
The url that we should send auth requests using the HTTP-POST binding to

`idp.signature`  
This is the object that contains the certificates and signature algorithm that we should accept for signing the
identity provider's assertions

`idp.signature.algorithm`  
Currently, supported are `sha256` and `sha512` this is the algorithm with which the identity provider will sign the
assertions

`idp.signature.allowedCertificates`  
These are the public certificates that correspond to the private key the identity provider is using to sign the
assertions. It must have at least one entry as we don't support unsigned requests at the moment.

### The `signature` object

It should contain everything needed to sign our request to the identity provider.
Because we are trying to be secure by default, this is not optional.

`signature.algorithm`  
The signing algorithm to use. Only `sha256` and `sha512` are supported at the moment.

`signature.certificate`  
The pem encoded public key used to sign your requests.

`signature.key`  
The pem encoded public key used to sign your requests.

### The `preferences` object

`preferences.signLoginRequests` default true  
Set to true to sign login requests (aka authnRequests). When set to false the login requests will not be signed

`preferences.signLoginRequests` default false  
When set to true, it ensures that the identity provider sends `notBefore` and `notOnOrAfter` and that the assertion
is received in the interval.  
When set to false it will not error if the identity provider does not send them but will still check that the assertion
is in the interval if the dates are provided.

`preferences.nameIdFormat` default 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'  
The name id policy you want to use. For now only this one is supported so I would recommend not changing this

`preferences.addNameIdPolicy` default false  
Set to true to not send the `nameIdFormat` along with login requests. This voids the previous parameter when set to true.

`preferences.forceAuthenticationByDefault` default false  
Request the identity provider to prompt the user with a challenge (e.g user name + password) even if they have a valid
session when set to true.

`preferences.attributeMapping` default '{}'  
Mapping for the attributes given by the identity provider in the Attribute field. I would not worry about that too much
unless you need extra claims from the identity provider.
Example:

```
{
    'http://schemas.microsoft.com/identity/claims/objectidentifier': 'id',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'email'
}
```

Full example:

```typescript
const options = {
    sp: {
        id: 'http://service-provider.zaptic',
        assertionUrl: 'http://localhost:7000/sp/login',
        singleLogoutUrl: 'http://localhost:7000/sp/logout',
        signature: [
            {
                algorithm: <'sha256'>'sha256',
                certificate: testCert,
                key: testKey
            }
        ]
    },
    idp: {
        id: 'test-idp',
        loginRedirectUrl: 'http://localhost:7000/idp/requestLogin',
        loginPostUrl: 'http://localhost:7000/idp/requestLogin',
        signature: {
            algorithm: <'sha256'>'sha256',
            allowedCertificates: []
        }
    },
    preferences: {
        forceAuthenticationByDefault: true,
        signLoginRequests: false,
        strictTimeCheck: true,
        addNameIdPolicy: true,
        attributeMapping: {
            'http://schemas.microsoft.com/identity/claims/objectidentifier': 'id',
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'email'
        }
    },
    getUUID: () => 'test-uuid'
}
```
