export type AlgorithmAttribute = { $: { Algorithm: string } }

export interface Signature {
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

export interface KeyInfo {
    X509Data: {
        X509Certificate: { _: string }[]
    }[]
}
