import { getErrorMessage, stringifyUnknown } from '@/utils/err/errUtils'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

import db, { User } from '@/utils/db'
import logger from '@/utils/logger'
import bcrypt from 'bcrypt'

import jwt from 'jsonwebtoken'

import config from '@/config'

import type { ServiceFailure } from './utils'

export enum UserServiceError {
    DUPLICATE_USER_NAME = 'duplicate_username',
    INPUT_VALIDATION_ERROR = 'request_body_error',
    WRONG_PASSWORD = 'password_not_match',
    NO_USER = 'no_user',
    JWT_VERIFY_ERROR = 'jwt_verify_error',
    JWT_PAYLOAD_ERROR = 'jwt_payload_error',
    UNKOWN_PRISMA_ERROR = 'unkown_prisma_error',
    UNKOWN_ERROR = 'unkown_error',
    NON_ERROR_TYPE = 'not_error_type',
}
// createUser
const createUser = async (
    userName: string,
    password: string
): Promise<User> => {
    validateCreateUserInput(userName, password)
    try {
        return await db.user.create({
            data: {
                userName,
                password: await bcrypt.hash(password, 10),
            },
        })
    } catch (err) {
        throw handleCreateUserError(err)
    }
}

const validateCreateUserInput = (userName: string, password: string) => {
    if (password.length < 8) {
        const error: ServiceFailure = {
            name: UserServiceError.INPUT_VALIDATION_ERROR,
            message: '密码长度需要大于8',
        }
        throw error
    }

    if (password.includes(' ')) {
        const error: ServiceFailure = {
            name: UserServiceError.INPUT_VALIDATION_ERROR,
            message: '密码不能包含空格',
        }
        throw error
    }

    if (userName.includes(' ')) {
        const error: ServiceFailure = {
            name: UserServiceError.INPUT_VALIDATION_ERROR,
            message: '用户名不能包含空格',
        }
        throw error
    }

    if (userName.length < 4) {
        const error: ServiceFailure = {
            name: UserServiceError.INPUT_VALIDATION_ERROR,
            message: '用户名长度需要大于4',
        }
        throw error
    }
}

const handleCreateUserError = (err: unknown): ServiceFailure => {
    const isError = err instanceof Error

    if (isError) {
        const isPrismaError = err instanceof PrismaClientKnownRequestError

        if (isPrismaError) {
            if (err.code === 'P2002') {
                return {
                    name: UserServiceError.DUPLICATE_USER_NAME,
                    message: '该用户名已被注册',
                }
            } else {
                logger.error(err.message)
                return {
                    name: UserServiceError.UNKOWN_PRISMA_ERROR,
                    message: err.message,
                }
            }
        } else {
            logger.error(err.message)
            return {
                name: UserServiceError.UNKOWN_ERROR,
                message: err.message,
            }
        }
    } else {
        const message = stringifyUnknown(err)
        logger.error(message)
        return { name: UserServiceError.NON_ERROR_TYPE, message }
    }
}

// createAuthToken
const createAuthToken = (userId: number): string => {
    const payload = { userId } // 必须使用 object，否则不能设置 expiresIn
    const expiresIn = config.tokenExpireDays
    const token = jwt.sign(payload, config.appSecret, {
        expiresIn,
    })
    return token
}

// login
const login = async (userName: string, password: string): Promise<User> => {
    const user = await db.user.findUnique({ where: { userName } })

    if (!user)
        throw {
            name: UserServiceError.NO_USER,
            message: `找不到用户 ${userName}`,
        }

    const isMatch = await bcrypt.compare(password, user.password)

    if (isMatch) return user

    throw {
        name: UserServiceError.WRONG_PASSWORD,
        message: '密码错误',
    }
}

// getUserByToken
export const getUserByToken = async (token: string): Promise<User> => {
    const secret = config.appSecret

    const userId = getUserIdFromToken(token, secret)

    const user = await db.user.findUnique({ where: { id: userId } })

    if (!user) {
        throw {
            name: UserServiceError.NO_USER,
            message: '找不到用户',
        }
    }

    return user
}

// tryGetUserIdFromToken
const getUserIdFromToken = (token: string, secret: string) => {
    const decoded = decodeToken(token, secret)

    if (typeof decoded === 'string') {
        throw {
            name: UserServiceError.JWT_PAYLOAD_ERROR,
            message: 'decoded 不应该是 string',
        }
    }

    let userId: number
    try {
        userId = getUserIdFromPayload(decoded)
    } catch (err) {
        throw {
            name: UserServiceError.JWT_PAYLOAD_ERROR,
            message: getErrorMessage(err),
        }
    }
    return userId
}

// decodeToken
export const decodeToken = (
    token: string,
    secret: string
): jwt.JwtPayload | string => {
    try {
        return jwt.verify(token, secret)
    } catch (err) {
        const isError = err instanceof Error

        if (isError) {
            if (err instanceof jwt.TokenExpiredError) {
                const error = {
                    name: 'TokenExpiredError',
                    message: err.message,
                }
                throw error
            }

            if (err instanceof jwt.JsonWebTokenError) {
                const error = {
                    name: 'JsonWebTokenError',
                    message: err.message,
                }
                throw error
            }

            const error = { name: 'UnknownError', message: err.message }
            throw error
        } else {
            const message = stringifyUnknown(err)
            logger.error(message)
            const error = { name: 'nonErrorCatch', message: message }
            throw error
        }
    }
}

const getUserIdFromPayload = (payload: jwt.JwtPayload) => {
    if ('userId' in payload) {
        if (typeof payload['userId'] === 'number') {
            return payload['userId']
        } else {
            throw Error('userId 不是 number')
        }
    } else {
        throw Error('jwt payload 里没有 userId')
    }
}

export const getUserCommunities = async (userId: number): Promise<number[]> => {
    const entries = await db.communityUser.findMany({
        where: {
            userId,
        },
    })
    return entries.map((entry) => entry.communityId)
}

export default {
    createUser,
    createAuthToken,
    login,
    getUserByToken,
    getUserCommunities,
}
