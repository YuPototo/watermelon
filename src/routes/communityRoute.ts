import { Router } from 'express'

import { getCommunitiesHandler } from '@/controllers/communityController'

const router = Router()

router.route('').get(getCommunitiesHandler)

export default router
