import { Router } from 'express'

import {
    getCommunitiesHandler,
    getCommunityInfoHandler,
} from '@/controllers/communityController'

const router = Router()

router.route('').get(getCommunitiesHandler)
router.route('/:id').get(getCommunityInfoHandler)

export default router
