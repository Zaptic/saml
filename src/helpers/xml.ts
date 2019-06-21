import * as path from 'path'
import * as xsd from 'libxmljs'
import * as xml2js from 'xml2js'
import * as fs from 'fs'

export type Validator = (xml: string) => Promise<boolean>

export function loadXSD(pathToLoad: string): Validator {
    // See here as to why we need a tailing '/' https://stackoverflow.com/a/46550671/7200410
    const baseUrl = path.resolve(__dirname, '../../resources/') + '/'

    // The any option is actually valid
    // see here for explanation https://github.com/libxmljs/libxmljs/issues/275#issuecomment-312145331
    const parsedXsd = xsd.parseXml(fs.readFileSync(path.resolve(baseUrl, pathToLoad), 'utf8'), { baseUrl } as any)

    return (xml: string) =>
        new Promise<boolean>((resolve, reject) => {
            const parsedXml = xsd.parseXml(xml, { baseUrl } as any)

            if (parsedXml.validate(parsedXsd)) resolve(true)
            else reject(parsedXml.validationErrors)
        })
}

export function parseXML<T>(xml: string) {
    return new Promise<T>((resolve, reject) => {
        const options = {
            tagNameProcessors: [xml2js.processors.stripPrefix],
            attrNameProcessors: [xml2js.processors.stripPrefix],
            explicitCharkey: true,
            explicitArray: true,
            explicitRoot: false
        }

        xml2js.parseString(xml, options, (error, result) => {
            if (error) return reject(error)
            resolve(result)
        })
    })
}
