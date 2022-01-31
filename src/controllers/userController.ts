import { RequestHandler } from 'express'

import userService, { UserServiceError } from '@/services/userService'
import { logger } from '@/utils/logger/logger'

import { isServiceFailure, ServiceFailure } from '@/services/utils'
import { ReturnableControllerObj } from './utils'

// createUserHandler
export const createUserHandler: RequestHandler = async (req, res, next) => {
    const { password, userName } = req.body
    if (!password || !userName) {
        res.status(400).json({ message: '缺少 password 或 name' })
        return
    }

    try {
        const user = await userService.createUser(userName, password)
        const token = await userService.createAuthToken(user.id)
        const data = {
            user: { userName: user.userName, userId: user.id },
            token,
        }
        res.status(201).json(data)
        return
    } catch (err) {
        if (isServiceFailure(err)) {
            const { statusCode, message } = handleCreateUserSeriviceError(err)
            return res.status(statusCode).json({ message })
        }
        next(err)
    }
}

const handleCreateUserSeriviceError = (
    error?: ServiceFailure
): ReturnableControllerObj => {
    if (!error) {
        const message = 'createUser return no proper error'
        logger.error(message)
        return { statusCode: 500, message }
    }
    const { name: errorName, message: errorMessage } = error

    if (errorName === UserServiceError.DUPLICATE_USER_NAME) {
        return { statusCode: 409, message: errorMessage }
    }
    if (errorName === UserServiceError.INPUT_VALIDATION_ERROR) {
        return { statusCode: 400, message: errorMessage }
    }

    return { statusCode: 500, message: errorMessage }
}

// loginHandler
export const userLoginHandler: RequestHandler = async (req, res, next) => {
    const { password, userName } = req.body

    if (!password || !userName) {
        res.status(400).json({ message: '缺少 password 或 name' })
        return
    }

    try {
        const user = await userService.login(userName, password)
        const token = await userService.createAuthToken(user.id)
        const data = {
            user: { userName: user.userName, userId: user.id },
            token,
        }
        return res.json(data)
    } catch (err) {
        if (isServiceFailure(err)) {
            const { statusCode, message } = handleLoginSeriviceError(err)
            return res.status(statusCode).json({ message })
        }
        next(err)
    }
}

const handleLoginSeriviceError = (
    error?: ServiceFailure
): ReturnableControllerObj => {
    if (!error) {
        const message = 'lgoin return no proper error'
        logger.error(message)
        return { statusCode: 500, message }
    }

    const { name: errorName, message: errorMessage } = error

    if (errorName === UserServiceError.WRONG_PASSWORD) {
        return { statusCode: 401, message: errorMessage }
    }

    if (errorName === UserServiceError.NO_USER) {
        return { statusCode: 401, message: errorMessage }
    }

    return { statusCode: 500, message: errorMessage }
}
