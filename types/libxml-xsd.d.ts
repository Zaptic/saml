declare module 'libxml-xsd' {
    export type ValidateFunction = (
        schema: string,
        callback: (technicalErrors: Error, validationErrors: Error) => void
    ) => void

    export function parseFile(
        path: string,
        callback: (error: Error, schema: { validate: ValidateFunction }) => void
    ): void
}
