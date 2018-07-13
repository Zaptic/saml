import * as xsd from 'libxml-xsd';
import { XPath } from './xml';
declare type IDPOptions = {
    id: string;
    loginUrl: string;
    signature: {
        certificate: string;
        algorithm: 'sha256' | 'sha512';
        allowedCertificates: string[];
    };
};
declare type SPOptions = {
    id: string;
    singleLogoutUrl: string;
    assertionUrl: string;
    signature: {
        certificate: string;
        key: string;
        algorithm: 'sha256' | 'sha512';
    };
};
export declare type Options = {
    signLoginRequests?: boolean;
    attributeMapping?: {
        [key: string]: XPath;
    };
    strictTimeCheck?: boolean;
    nameIdFormat?: string;
    getUUID: () => string | Promise<string>;
    idp: IDPOptions;
    sp: SPOptions;
};
export default class SAMLProvider {
    protocolSchema: {
        validate: xsd.ValidateFunction;
    } | null;
    metadataShema: {
        validate: xsd.ValidateFunction;
    } | null;
    private readonly options;
    constructor(options: Options);
    init(): Promise<this>;
    buildLoginRequestRedirectURL(RelayState?: string): Promise<string>;
    parseLoginResponse(query: {
        [key: string]: any;
    }): Promise<{
        assertion: {
            [x: string]: string;
        };
        relayState: string;
    }>;
    getMetadata(): string;
    private extract;
}
export {};
