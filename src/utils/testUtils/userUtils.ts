import db from '../db'
import jwt from 'jsonwebtoken'

import config from '../../config'

const createUser = async (id: number, userName: string) => {
    await db.user.create({
        data: { id, userName, password: 'test_password' },
    })
}

const createToken = (userId: number): string => {
    return jwt.sign({ userId }, config.appSecret)
}

export default {
    createUser,
    createToken,
}
