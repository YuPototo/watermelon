import db, { User, Post } from '@/utils/db'
import type { AtMostOneOf } from '@/utils/types/typesHelper'
import userService from './userService'
import { communityQueryBuilder } from './utils'

interface Cursor {
    id: number
}

type BeforeOrAfter = AtMostOneOf<{ before: string; after: string }>

export const createCursor = ({
    before,
    after,
}: BeforeOrAfter): Cursor | undefined => {
    if (before) {
        return { id: parseInt(before) }
    }
    if (after) {
        return { id: parseInt(after) }
    }
}

const createSkip = ({ before, after }: BeforeOrAfter): number => {
    if (before || after) return 1
    return 0
}

const createLimit = ({ limit, before }: GetPostsArgs): number => {
    if (before) {
        return -(limit + 1)
    } else return limit + 1
}

export type GetPostsArgs = {
    limit: number
} & BeforeOrAfter

interface GetPostsRes {
    hasNext: boolean
    hasPrev: boolean
    posts: Post[]
}

const getAllPosts = async (arg: GetPostsArgs): Promise<GetPostsRes> => {
    const { before, after } = arg
    const cursor = createCursor(arg)
    const skip = createSkip(arg)
    const limit = createLimit(arg)

    let hasNext = before ? true : false
    let hasPrev = after ? true : false

    const posts = await db.post.findMany({
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        cursor,
        skip,
    })

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    return { hasNext, hasPrev, posts }
}

export type GetCommunityPostsArgs = {
    communityId: number
    limit: number
} & BeforeOrAfter

const getCommunityPosts = async (arg: GetCommunityPostsArgs) => {
    const { communityId, before, after } = arg
    const cursor = createCursor(arg)
    const skip = createSkip(arg)
    const limit = createLimit(arg)

    let hasNext = before ? true : false
    let hasPrev = after ? true : false

    const posts = await db.post.findMany({
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

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    return { hasNext, hasPrev, posts }
}

export type GetUserPostsArgs = {
    user: User
    limit: number
} & BeforeOrAfter

const getUserPosts = async (arg: GetUserPostsArgs) => {
    const { user, before, after } = arg
    const cursor = createCursor(arg)
    const skip = createSkip(arg)
    const limit = createLimit(arg)

    let hasNext = before ? true : false
    let hasPrev = after ? true : false

    const communityIds = await userService.getUserCommunities(user.id)

    const posts = await db.post.findMany({
        where: communityQueryBuilder(communityIds),
        orderBy: {
            createdAt: 'desc',
        },
        take: limit,
        cursor,
        skip,
    })

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    return { hasNext, hasPrev, posts }
}

const getPost = async (postId: number) => {
    return await db.post.findUnique({ where: { id: postId } })
}

interface CreatePostArgs {
    userId: number
    communityId: number
    title: string
    body?: string
}

const createPost = async ({
    communityId,
    title,
    body,
    userId,
}: CreatePostArgs) => {
    return await db.post.create({
        data: {
            userId,
            communityId,
            title,
            body,
        },
    })
}

export default {
    getAllPosts,
    getCommunityPosts,
    getUserPosts,
    getPost,
    createPost,
}
