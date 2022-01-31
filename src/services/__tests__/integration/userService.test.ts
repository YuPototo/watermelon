import userService from '../../userService'
import db from '@/utils/db'
import faker from '@faker-js/faker'
import jwt from 'jsonwebtoken'
import validator from 'validator'

import config from '@/config'

afterAll(async () => {
    await db.$disconnect()
})

afterEach(async () => {
    const deleteUser = db.user.deleteMany()
    await db.$transaction([deleteUser])
})

describe('createUser()', () => {
    it('should encrypt password', async () => {
        const password = faker.internet.password()

        const userOne = await userService.createUser('user_one', password)
        expect(userOne.password).not.toBe(password)

        const userTwo = await userService.createUser('user_two', password)
        expect(userTwo.password).not.toBe(password)

        expect(userOne.password).not.toBe(userTwo.password)
    })

    it('should create a user', async () => {
        const userName = 'some_user'
        const password = faker.internet.password()

        const userCreated = await userService.createUser(userName, password)
        const userFound = await db.user.findUnique({
            where: { id: userCreated.id },
        })

        expect(userFound).not.toBeNull()
        expect(userFound?.userName).toBe(userCreated.userName)
    })
})

describe('createAuthToken()', () => {
    const userId = 2

    it('should generate a valid jwt token', async () => {
        const token = await userService.createAuthToken(userId)
        expect(validator.isJWT(token)).toBeTruthy()
    })

    it('should generate a verifiable token', async () => {
        const token = await userService.createAuthToken(userId)
        const decoded = jwt.verify(token, config.appSecret) as jwt.JwtPayload
        expect(decoded.userId).toBe(userId)
    })
})

describe('getUserByToken()', () => {
    it('should return failure when decoded is string', async () => {
        const token = jwt.sign('somestring', config.appSecret)
        await expect(userService.getUserByToken(token)).rejects.toEqual({
            name: 'jwt_payload_error',
            message: 'decoded 不应该是 string',
        })
    })

    it('should return failure when decoded payload has no userId', async () => {
        const payload = { id: 'something_strange' }
        const token = jwt.sign(payload, config.appSecret)
        await expect(userService.getUserByToken(token)).rejects.toEqual({
            name: 'jwt_payload_error',
            message: 'jwt payload 里没有 userId',
        })
    })

    it('should return failure when token expires ', async () => {
        const payload = { userId: 'some_id' }
        const token = jwt.sign(payload, config.appSecret, { expiresIn: '1ms' })
        await expect(userService.getUserByToken(token)).rejects.toEqual({
            name: 'TokenExpiredError',
            message: 'jwt expired',
        })
    })

    it('should return failure when token is invalid expires ', async () => {
        const BAD_SECRET = 'bad_bad'
        const payload = { userId: 'some_id' }
        const token = jwt.sign(payload, BAD_SECRET)
        await expect(userService.getUserByToken(token)).rejects.toEqual({
            name: 'JsonWebTokenError',
            message: 'invalid signature',
        })
    })

    it('should return failure when user not found', async () => {
        const userId = 2
        const payload = { userId }
        const token = jwt.sign(payload, config.appSecret)
        await expect(userService.getUserByToken(token)).rejects.toEqual({
            name: 'no_user',
            message: '找不到用户',
        })
    })

    it('should return user when user found', async () => {
        const userName = 'some_user'
        const data = { userName, password: 'some_password' }
        const user = await db.user.create({ data })

        const userId = user.id
        const payload = { userId }
        const token = jwt.sign(payload, config.appSecret)

        const fetchedUser = await userService.getUserByToken(token)
        expect(fetchedUser.id).toBe(userId)
        expect(fetchedUser).toMatchObject({
            userName,
            password: expect.any(String),
            id: expect.any(Number),
        })
    })
})
