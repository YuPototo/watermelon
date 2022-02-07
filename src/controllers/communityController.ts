import { RequestHandler } from 'express'

import communityService from '@/services/communityService'

export const getCommunitiesHandler: RequestHandler = async (req, res, next) => {
    try {
        const communities = await communityService.getCommunities()
        return res.status(200).json({ communities })
    } catch (err) {
        next(err)
    }
}
