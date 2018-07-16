import * as path from 'path'
import * as xsd from 'libxml-xsd'

export function loadXSD(toLoad: string) {
    return new Promise<{ validate: xsd.ValidateFunction }>((resolve, reject) => {
        const cwd = path.resolve('')

        // see https://github.com/albanm/node-libxml-xsd/issues/11#issuecomment-242591323
        process.chdir(path.resolve(__dirname, '../resources/'))
        xsd.parseFile(path.resolve(toLoad), (error, schema) => {
            process.chdir(cwd)
            if (error) return reject(error)
            resolve(schema)
        })
    })
}
