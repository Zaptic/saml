export type AlgorithmAttribute = { $: { Algorithm: string } }

export type Signature = {
    SignedInfo: {
        CanonicalizationMethod: AlgorithmAttribute[]
        SignatureMethod: AlgorithmAttribute[]
        Reference: {
            $: { URI: string }
            Transforms: { Transform: { Transform: AlgorithmAttribute[] }[] }
            DigestMethod: AlgorithmAttribute[]
            DigestValue: { _: string }[]
        }
    }[]
    SignatureValue: { _: string }[]
    KeyInfo: KeyInfo[]
}

export type KeyInfo = {
    X509Data: {
        X509Certificate: { _: string }[]
    }[]
}
