import { Router } from 'express'

import {
    joinCommunityHandler,
    leaveCommunityHandler,
    getIsMemberHandler,
} from '@/controllers/communityUserController'
import { auth } from '@/middleware/auth'

const router = Router()

router
    .route('/:id')
    .put(auth, joinCommunityHandler)
    .delete(auth, leaveCommunityHandler)
    .get(auth, getIsMemberHandler)

export default router
