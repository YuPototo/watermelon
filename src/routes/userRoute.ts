import { Router } from 'express'

import {
    createUserHandler,
    userLoginHandler,
} from '@/controllers/userController'

const router = Router()

router.route('/').post(createUserHandler)
router.route('/login').post(userLoginHandler)

export default router
