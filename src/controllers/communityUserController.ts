import { RequestHandler } from 'express'

import communityService from '@/services/communityService'

export const joinCommunityHandler: RequestHandler = async (req, res, next) => {
    const { id: communityId } = req.params
    try {
        await communityService.joinCommunity(req.user.id, parseInt(communityId))
        return res.status(201).json()
    } catch (err) {
        next(err)
    }
}

export const leaveCommunityHandler: RequestHandler = async (req, res, next) => {
    const { id: communityId } = req.params
    try {
        await communityService.leaveCommunity(
            req.user.id,
            parseInt(communityId)
        )
        return res.status(200).json()
    } catch (err) {
        next(err)
    }
}
