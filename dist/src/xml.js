"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xmldom_1 = require("xmldom");
const xpath = require("xpath");
const path = require("path");
const xsd = require("libxml-xsd");
function extractFields(xmlString, mapping) {
    const document = new xmldom_1.DOMParser().parseFromString(xmlString);
    const result = {};
    for (const key in mapping) {
        if (!mapping.hasOwnProperty(key))
            continue;
        const element = xpath.select(mapping[key], document).map(attribute => attribute.nodeValue.toString());
        if (element.length !== 1)
            throw new Error(`Expected only one element for ${mapping[key]}`);
        result[key] = element[0];
    }
    return result;
}
exports.extractFields = extractFields;
function getAttribute(name, attr) {
    return `//*[local-name(.)='${name}']/@${attr}`;
}
exports.getAttribute = getAttribute;
function getText(name) {
    return `//*[local-name(.)='${name}']/text()`;
}
exports.getText = getText;
function loadXSD(toLoad) {
    return new Promise((resolve, reject) => {
        const cwd = path.resolve('');
        // see https://github.com/albanm/node-libxml-xsd/issues/11#issuecomment-242591323
        process.chdir(path.resolve('./resources/'));
        xsd.parseFile(path.resolve(`./${toLoad}`), (error, schema) => {
            process.chdir(cwd);
            if (error)
                return reject(error);
            resolve(schema);
        });
    });
}
exports.loadXSD = loadXSD;
//# sourceMappingURL=xml.js.map