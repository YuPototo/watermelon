import db, { User, Post } from '@/utils/db'
import type { AtMostOneOf, RequireAtLeastOne } from '@/utils/types/typesHelper'
import userService from './userService'
import { communityQueryBuilder } from './utils'

export enum PostServiceError {
    NO_RESOURCE = 'no_resouce',
}

type RawPost = Post & {
    _count: {
        Comment: number
    }
}

interface PostOutput {
    id: number
    title: string
    body: string | null
    createdAt: Date
    updatedAt: Date
    commentCount: number
    user: {
        id: number
        userName: string
    }
    community: {
        id: number
        name: string
    }
}
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
    posts: PostOutput[]
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
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    const postOutputs = []
    for (const post of posts) {
        const postOutput = await postToPostOutput(post)
        postOutputs.push(postOutput)
    }

    return { hasNext, hasPrev, posts: postOutputs }
}

export type GetCommunityPostsArgs = {
    communityId: number
    limit: number
} & BeforeOrAfter

const getCommunityPosts = async (
    arg: GetCommunityPostsArgs
): Promise<GetPostsRes> => {
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
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    const postOutputs = []
    for (const post of posts) {
        const postOutput = await postToPostOutput(post)
        postOutputs.push(postOutput)
    }

    return { hasNext, hasPrev, posts: postOutputs }
}

export type GetUserPostsArgs = {
    user: User
    limit: number
} & BeforeOrAfter

const getUserPosts = async (arg: GetUserPostsArgs): Promise<GetPostsRes> => {
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
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })

    if (posts.length === limit) {
        hasNext = true
        posts.pop()
    }

    if (before && posts.length === Math.abs(limit)) {
        hasPrev = true
        posts.shift()
    }

    const postOutputs = []
    for (const post of posts) {
        const postOutput = await postToPostOutput(post)
        postOutputs.push(postOutput)
    }

    return { hasNext, hasPrev, posts: postOutputs }
}

const getRawPost = async (postId: number): Promise<RawPost> => {
    const post = await db.post.findUnique({
        where: { id: postId },
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })

    if (!post) {
        throw {
            name: PostServiceError.NO_RESOURCE,
            message: '找不到 Post',
        }
    }
    return post
}

const getPost = async (postId: number) => {
    const post = await getRawPost(postId)
    return await postToPostOutput(post)
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
    const post = await db.post.create({
        data: {
            userId,
            communityId,
            title,
            body,
        },
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })
    return await postToPostOutput(post)
}

const postToPostOutput = async (post: RawPost) => {
    const user = await db.user.findUnique({ where: { id: post.userId } })
    if (user === null) {
        throw new Error(`找不到 user ${post.userId}`)
    }

    const community = await db.community.findUnique({
        where: { id: post.communityId },
    })
    if (!community) {
        throw new Error(`找不到 community ${post.communityId}`)
    }

    const postOutput = {
        id: post.id,
        title: post.title,
        body: post.body,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: { id: user.id, userName: user.userName },
        community: { id: community.id, name: community.name },
        commentCount: post._count.Comment,
    }

    return postOutput
}

type UpdatePostFields = RequireAtLeastOne<{ title: string; body: string }>
type UpdatePostArg = { id: number } & UpdatePostFields

const updatePost = async ({ id, title, body }: UpdatePostArg) => {
    const post = await db.post.update({
        where: { id },
        data: { title, body },
        include: {
            _count: {
                select: { Comment: true },
            },
        },
    })
    return await postToPostOutput(post)
}

export default {
    getAllPosts,
    getCommunityPosts,
    getUserPosts,
    getPost,
    createPost,
    getRawPost,
    updatePost,
}
