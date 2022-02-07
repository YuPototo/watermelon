import { Router } from 'express'

import {
    joinCommunityHandler,
    leaveCommunityHandler,
} from '@/controllers/communityUserController'
import { auth } from '@/middleware/auth'

const router = Router()

router
    .route('/:id')
    .put(auth, joinCommunityHandler)
    .delete(auth, leaveCommunityHandler)

export default router
