import { Router } from 'express'

import {
    getAllPostsHandler,
    getCommunityPostsHandler,
    getUserPostsHandler,
    getPostHandler,
    createPostHandler,
} from '@/controllers/postController'
import { auth } from '@/middleware/auth'

const router = Router()

router.route('/all/new').get(getAllPostsHandler)
router.route('/community/:communityId/new').get(getCommunityPostsHandler)
router.route('/me/new').get(auth, getUserPostsHandler)
router.route('/:postId').get(getPostHandler)
router.route('').post(auth, createPostHandler)

export default router
