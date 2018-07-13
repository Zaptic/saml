import { DOMParser } from 'xmldom'
import * as xpath from 'xpath'
import * as path from 'path'
import * as xsd from 'libxml-xsd'

export type XPath = string

type Mapping = { [key: string]: XPath }

export function extractFields(xmlString: string, mapping: Mapping) {
    const document = new DOMParser().parseFromString(xmlString)
    const result: { [key in keyof Mapping]: string } = {}

    for (const key in mapping) {
        if (!mapping.hasOwnProperty(key)) continue
        const element = xpath.select(mapping[key], document).map(attribute => attribute.nodeValue.toString())

        if (element.length !== 1) throw new Error(`Expected only one element for ${mapping[key]}`)
        result[key] = element[0]
    }

    return result
}

export function getAttribute(name: string, attr: string): XPath {
    return `//*[local-name(.)='${name}']/@${attr}`
}

export function getText(name: string): XPath {
    return `//*[local-name(.)='${name}']/text()`
}

export function loadXSD(toLoad: string) {
    return new Promise<{ validate: xsd.ValidateFunction }>((resolve, reject) => {
        const cwd = path.resolve('')

        // see https://github.com/albanm/node-libxml-xsd/issues/11#issuecomment-242591323
        process.chdir(path.resolve('./resources/'))
        xsd.parseFile(path.resolve(`./${toLoad}`), (error, schema) => {
            process.chdir(cwd)
            if (error) return reject(error)
            resolve(schema)
        })
    })
}
