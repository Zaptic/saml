import * as xsd from 'libxml-xsd';
export declare type XPath = string;
declare type Mapping = {
    [key: string]: XPath;
};
export declare function extractFields(xmlString: string, mapping: Mapping): {
    [x: string]: string;
};
export declare function getAttribute(name: string, attr: string): XPath;
export declare function getText(name: string): XPath;
export declare function loadXSD(toLoad: string): Promise<{
    validate: xsd.ValidateFunction;
}>;
export {};
