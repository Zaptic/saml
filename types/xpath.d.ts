declare module 'xpath' {
    export function select<T>(xpath: string, xml: T): T[] | T
}
