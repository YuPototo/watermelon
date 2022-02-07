import db from '@/utils/db'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime'

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

export default { getCommunities, joinCommunity, leaveCommunity }
