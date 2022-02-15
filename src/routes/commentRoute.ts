import { Router } from 'express'

import {
    createCommentHandler,
    updateCommentHandler,
} from '@/controllers/commentController'
import { auth } from '@/middleware/auth'

const router = Router()

router.route('').post(auth, createCommentHandler)
router.route('/:id').patch(auth, updateCommentHandler)

export default router
