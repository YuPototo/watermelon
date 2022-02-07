import db from '../db'
import jwt from 'jsonwebtoken'

import config from '../../config'

const createUser = async (id: number) => {
    await db.user.create({
        data: { id, userName: 'test_user', password: 'test_password' },
    })
}

const createToken = (userId: number): string => {
    return jwt.sign({ userId }, config.appSecret)
}

export default {
    createUser,
    createToken,
}
