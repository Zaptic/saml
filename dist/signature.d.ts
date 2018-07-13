export declare function signXML(xmlToSign: string, options: {
    certificate: string;
    key: string;
    algorithm: 'sha256' | 'sha512';
}): string;
export declare type CheckSignatureOptions = {
    certificate: string;
    algorithm: 'sha256' | 'sha512';
    allowedCertificates: string[];
};
export declare function checkSignature(xmlToCheck: string, options: CheckSignatureOptions): void;
