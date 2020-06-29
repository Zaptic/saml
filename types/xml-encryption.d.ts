declare module 'xml-encryption' {
    export interface EncryptOptions {
        rsa_pub: string
        pem: string
        encryptionAlgorithm: string
        keyEncryptionAlgorighm: string
    }

    export interface DecryptOptions {
        key: string
    }

    export function encrypt(xml: string, options: EncryptOptions, callback: (err: Error, result: string) => void)
    export function decrypt(xml: string, options: DecryptOptions, callback: (err: Error, result: string) => void)
}
