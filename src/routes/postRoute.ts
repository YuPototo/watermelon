import { Router } from 'express'

import {
    getAllPostsHandler,
    getCommunityPostsHandler,
    getUserPostsHandler,
    getPostHandler,
} from '@/controllers/postController'
import { auth } from '@/middleware/auth'

const router = Router()

router.route('/all/new').get(getAllPostsHandler)
router.route('/community/:communityId/new').get(getCommunityPostsHandler)
router.route('/me/new').get(auth, getUserPostsHandler)
router.route('/:postId').get(getPostHandler)

export default router
