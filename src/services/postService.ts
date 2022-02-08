import db, { User } from '@/utils/db'
import userService from './userService'
import { communityQueryBuilder } from './utils'

interface GetPostsArgs {
    limit: number
    before?: string
    after?: string
}

const getAllPosts = async ({
    limit: limitArg,
    before,
    after,
}: GetPostsArgs) => {
    let cursor: { id: number } | undefined = undefined
    let skip = 0
    let limit = limitArg
    if (before) {
        cursor = {
            id: parseInt(before),
        }
        limit = -limitArg
        skip = 1
    } else if (after) {
        cursor = {
            id: parseInt(after),
        }
        skip = 1
    }

    return await db.post.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        cursor,
        skip,
    })
}

interface GetCommunityPostsArgs {
    communityId: number
    limit: number
    before?: string
    after?: string
}

const getCommunityPosts = async ({
    communityId,
    limit: limitArg,
    before,
    after,
}: GetCommunityPostsArgs) => {
    let cursor: { id: number } | undefined = undefined
    let skip = 0
    let limit = limitArg
    if (before) {
        cursor = {
            id: parseInt(before),
        }
        limit = -limitArg
        skip = 1
    } else if (after) {
        cursor = {
            id: parseInt(after),
        }
        skip = 1
    }

    return await db.post.findMany({
        where: {
            communityId,
        },
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        cursor,
        skip,
    })
}

interface GetUserPostsArgs {
    user: User
    limit: number
    before?: string
    after?: string
}

const getUserPosts = async ({
    user,
    limit: limitArg,
    before,
    after,
}: GetUserPostsArgs) => {
    const communityIds = await userService.getUserCommunities(user.id)

    let cursor: { id: number } | undefined = undefined
    let skip = 0
    let limit = limitArg
    if (before) {
        cursor = {
            id: parseInt(before),
        }
        limit = -limitArg
        skip = 1
    } else if (after) {
        cursor = {
            id: parseInt(after),
        }
        skip = 1
    }

    return await db.post.findMany({
        where: communityQueryBuilder(communityIds),
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        cursor,
        skip,
    })
}

const getPost = async (postId: number) => {
    return await db.post.findUnique({ where: { id: postId } })
}

export default { getAllPosts, getCommunityPosts, getUserPosts, getPost }
