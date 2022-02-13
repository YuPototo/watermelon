import db from '@/utils/db'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

export enum CommunityServiceError {
    NO_RESOURCE = 'no_resouce',
}

const getCommunities = async () => {
    return await db.community.findMany()
}

const joinCommunity = async (userId: number, communityId: number) => {
    try {
        await db.communityUser.create({
            data: {
                userId,
                communityId,
            },
        })
    } catch (err) {
        const isPrismaError = err instanceof PrismaClientKnownRequestError
        if (isPrismaError && err.code === 'P2002') {
            // P2002 表示已经有加入记录
            return
        } else {
            throw err
        }
    }
}

export const leaveCommunity = async (userId: number, communityId: number) => {
    try {
        await db.communityUser.delete({
            where: {
                userId_communityId: { userId, communityId },
            },
        })
    } catch (err) {
        const isPrismaError = err instanceof PrismaClientKnownRequestError
        if (isPrismaError && err.code === 'P2025') {
            // P2025 表示找不到记录
            return
        } else {
            throw err
        }
    }
}

const checkIsMember = async (userId: number, communityId: number) => {
    const record = await db.communityUser.findUnique({
        where: {
            userId_communityId: { userId, communityId },
        },
    })
    if (record) {
        return true
    } else {
        return false
    }
}

const getCommunityInfo = async (communityId: number) => {
    const record = await db.community.findUnique({
        where: {
            id: communityId,
        },
    })
    if (record) {
        return record
    } else {
        throw {
            name: CommunityServiceError.NO_RESOURCE,
            message: '找不到 Community',
        }
    }
}
export default {
    getCommunities,
    joinCommunity,
    leaveCommunity,
    checkIsMember,
    getCommunityInfo,
}
