import { Router } from 'express'

import { createErrorLog } from '@/controllers/logController'

const router = Router()

router.route('/error').post(createErrorLog)

export default router
