import { assert } from 'chai'

export function assertPromiseRejects<T>(promise: Promise<T>, message: string) {
    let isFulfilled = false

    return promise
        .catch(error => {
            isFulfilled = true
            assert.equal(error.message, message)
        })
        .then(_ => !isFulfilled && assert.fail(null, null, 'Promise should have been rejected'))
}
