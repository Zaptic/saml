import * as path from 'path'
import * as xsd from 'libxml-xsd'
import * as xml2js from 'xml2js'

type Validator = { validate: xsd.ValidateFunction }

export function loadXSD(toLoad: string) {
    return new Promise<{ validate: xsd.ValidateFunction }>((resolve, reject) => {
        const cwd = path.resolve('')

        // see https://github.com/albanm/node-libxml-xsd/issues/11#issuecomment-242591323
        process.chdir(path.resolve(__dirname, '../../resources/'))
        xsd.parseFile(path.resolve(toLoad), (error, schema) => {
            process.chdir(cwd)
            if (error) return reject(error)
            resolve(schema)
        })
    })
}

export function validateXML(xml: string, validator: Validator) {
    return new Promise((resolve, reject) => {
        validator.validate(xml, (technicalErrors, validationErrors) => {
            if (technicalErrors) return reject(`Technical errors: ${technicalErrors}`)
            if (validationErrors) return reject(`Validation errors: ${validationErrors}`)
            resolve()
        })
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
