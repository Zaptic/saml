// TODO Check the tsd to find out what is actually [T] instead of T[]
export type SAMLResponse = {
    $: {
        Destination: string
        ID: string
        InResponseTo: string
        IssueInstant: string
        Version: string
    }
    Issuer: { _: string }[]
    Status: { StatusCode: { $: { Value: string } }[] }[]
    Assertion: Assertion[]
}

export type Assertion = {
    $: {
        ID: string
        IssueInstant: string
        Version: string
        xmlns: string
    }
    Issuer: string[]
    Signature: Signature[]
    Subject: Subject[]
    Conditions: Conditions[]
    AttributeStatement: AttributeStatement[]
}

export type AttributeStatement = {
    Attribute: {
        $: { Name: string }
        AttributeValue: [string]
    }
}

export type Conditions = {
    $: {
        NotBefore: string
        NotOnOrAfter: string
    }
    AudienceRestriction: { Audience: string[] }[]
}

export type Subject = {
    NameID: { _: string }[]
    SubjectConfirmation: {
        $: { Method: string }
        SubjectConfirmationData: {
            $: {
                InResponseTo: string
                NotOnOrAfter: string
                Recipient: string
            }
        }
    }[]
}

export type Signature = {
    SignedInfo: {
        CanonicalizationMethod: AlgorithmAttribute[]
        SignatureMethod: AlgorithmAttribute[]
        Reference: {
            $: { URI: string }
            Transforms: { Transform: { Transform: AlgorithmAttribute[] }[] }
            DigestMethod: AlgorithmAttribute[]
            DigestValue: string[]
        }
    }[]
    SignatureValue: string[]
    KeyInfo: {
        X509Data: {
            X509Certificate: string[]
        }[]
    }[]
}

export type AlgorithmAttribute = { $: { Algorithm: string } }
