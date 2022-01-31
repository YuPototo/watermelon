import { RequestHandler } from 'express'

import logger from '@/utils/logger'

// * create todo controller
export const createErrorLog: RequestHandler = async (req, res) => {
    logger.error('this is log info')
    res.status(201).json({})
}
