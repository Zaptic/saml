declare module 'xml-crypto' {
    interface SignedXmlOptions {
        prefix?: string
        attrs?: {}
        location?: {
            reference?: string
            action?: 'append' | 'prepend' | 'before' | 'after'
        }
    }

    export class SignedXml {
        public signatureAlgorithm: string
        public keyInfoProvider: any
        public signingKey: any

        public computeSignature(xml: string, options?: SignedXmlOptions): void
        public getSignedXml(): string
        public loadSignature(signature: string): void
        public checkSignature(xml: string): boolean
        public addReference(xpath: string, b: string[], digestAlgorithm: string): void
    }
}
