import { validateAuthHeader } from '../auth'

describe('validateAuthHeader()', () => {
    it('return failure when input is empty', () => {
        expect(() => validateAuthHeader('')).toThrow()
        expect(() => validateAuthHeader(undefined)).toThrow()
    })

    it('return failure when format is wrong', () => {
        expect(() => validateAuthHeader('Bearer a b')).toThrow()
        expect(() => validateAuthHeader('Bearer')).toThrow()
    })

    it('return failure when auth type is wrong', () => {
        expect(() => validateAuthHeader('notBearer a')).toThrow()
    })

    it('reture success when token is JWT', () => {
        const jwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        expect(() => validateAuthHeader(`Bearer ${jwt}`)).not.toThrow()
    })
})
