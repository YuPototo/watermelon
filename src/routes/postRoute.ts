import { Router } from 'express'

import {
    getAllPostsHandler,
    getCommunityPostsHandler,
    getUserPostsHandler,
    getPostHandler,
    createPostHandler,
    updatePostHandler,
} from '@/controllers/postController'
import { auth } from '@/middleware/auth'
import { getCommentsHandler } from '@/controllers/commentController'

const router = Router()

router.route('/all/new').get(getAllPostsHandler)
router.route('/community/:communityId/new').get(getCommunityPostsHandler)
router.route('/me/new').get(auth, getUserPostsHandler)
router.route('/:postId').get(getPostHandler).patch(auth, updatePostHandler)
router.route('').post(auth, createPostHandler)
router.route('/:postId/comments').get(getCommentsHandler)

export default router
