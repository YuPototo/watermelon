import { decodeToken } from '@/services/userService'
import jwt from 'jsonwebtoken'

const SECRET = 'test_secret'

describe('newDecodeToken()', () => {
    it('should return failure when token expires', () => {
        const token = jwt.sign({ userId: 'some_id' }, SECRET, {
            expiresIn: '1ms',
        })
        expect(() => decodeToken(token, SECRET)).toThrow({
            name: 'TokenExpiredError',
            message: 'jwt expired',
        })
    })

    it('should return failure when token is invalid', () => {
        const BAD_SECRET = 'bad_secret'
        const token = jwt.sign({ userId: 'some_id' }, BAD_SECRET)

        expect(() => decodeToken(token, SECRET)).toThrow({
            name: 'JsonWebTokenError',
            message: 'invalid signature',
        })
    })

    it('should return failure when token is malformed', () => {
        // 合法的 JWT 有3个部分，用 . 隔开
        const badToken = 'token.abc'
        expect(() => decodeToken(badToken, SECRET)).toThrow({
            name: 'JsonWebTokenError',
            message: 'jwt malformed',
        })
    })

    it('should return success when decoded is jwt.Payload', () => {
        const token = jwt.sign({ userId: 'some_id' }, SECRET)

        const decoded = decodeToken(token, SECRET)
        expect(decoded).toEqual({
            userId: 'some_id',
            iat: expect.any(Number),
        })
    })
})
