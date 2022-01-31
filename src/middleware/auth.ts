import userService from '@/services/userService'
import { getErrorMessage } from '@/utils/err/errUtils'
import { RequestHandler } from 'express'

interface AuthError {
    name: string
    message: string
}

export const validateAuthHeader = (authHeader?: string) => {
    if (!authHeader) {
        const error: AuthError = {
            name: 'noAuthHeader',
            message: 'lack auth header',
        }
        throw error
    }

    const authHeaderList = authHeader.split(' ')

    if (authHeaderList.length !== 2) {
        const error: AuthError = {
            name: 'wrongAuthFormat',
            message: 'wrong auth format',
        }
        throw error
    }

    const authType = authHeaderList[0]
    if (authType !== 'Bearer') {
        const error: AuthError = {
            name: 'notBearerType',
            message: 'wrong auth header type',
        }
        throw error
    }
}

const getTokenFromHeader = (authHeader: string) => {
    const authHeaderList = authHeader.split(' ')
    return authHeaderList[1]
}

export const auth: RequestHandler = async (req, res, next) => {
    const authHeader = req.header('Authorization')
    try {
        validateAuthHeader(authHeader)
    } catch (err) {
        const message = `unauthorized: ${getErrorMessage(err)}`
        return res.status(401).json({ message })
    }

    const token = getTokenFromHeader(authHeader as string)

    try {
        const user = await userService.getUserByToken(token)
        req.user = user
        next()
        return
    } catch (err) {
        res.status(401).json({
            message: `unauthorized: ${getErrorMessage(err)}`,
        })
        return
    }
}
