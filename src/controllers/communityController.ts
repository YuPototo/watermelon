import { RequestHandler } from 'express'

import communityService, {
    CommunityServiceError,
} from '@/services/communityService'
import { isServiceFailure } from '@/services/utils'

export const getCommunitiesHandler: RequestHandler = async (req, res, next) => {
    try {
        const communities = await communityService.getCommunities()
        return res.status(200).json({ communities })
    } catch (err) {
        next(err)
    }
}

export const getCommunityInfoHandler: RequestHandler = async (
    req,
    res,
    next
) => {
    const { id } = req.params

    try {
        const community = await communityService.getCommunityInfo(parseInt(id))
        return res.status(200).json({ community })
    } catch (err) {
        if (isServiceFailure(err)) {
            if (err.name === CommunityServiceError.NO_RESOURCE) {
                return res.status(404).json({ message: err.message })
            }
        }
        next(err)
    }
}
