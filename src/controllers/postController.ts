import { RequestHandler } from 'express'
import postService, {
    GetCommunityPostsArgs,
    GetPostsArgs,
    GetUserPostsArgs,
    PostServiceError,
} from '@/services/postService'
import { isServiceFailure } from '@/services/utils'
import { Post } from '@prisma/client'

export const getAllPostsHandler: RequestHandler = async (req, res, next) => {
    const {
        limit: limitParam,
        before,
        after,
    } = req.query as {
        limit?: string
        before?: string
        after?: string
    }

    const limit = limitParam ? parseInt(limitParam) : 25

    if (before !== undefined && after !== undefined) {
        return res
            .status(400)
            .json({ message: '只允许 after 或 before 中的一个' })
    }

    try {
        const data = await postService.getAllPosts({
            limit,
            before,
            after,
        } as GetPostsArgs) // tech debts
        return res.json(data)
    } catch (err) {
        next(err)
    }
}

export const getCommunityPostsHandler: RequestHandler = async (
    req,
    res,
    next
) => {
    const { communityId } = req.params
    const {
        limit: limitParam,
        before,
        after,
    } = req.query as {
        limit?: string
        before?: string
        after?: string
    }

    const limit = limitParam ? parseInt(limitParam) : 25

    if (before && after) {
        return res
            .status(400)
            .json({ message: '只允许 after 或 before 中的一个' })
    }

    try {
        const data = await postService.getCommunityPosts({
            communityId: parseInt(communityId),
            limit,
            before,
            after,
        } as GetCommunityPostsArgs) // tech debts

        return res.json(data)
    } catch (err) {
        next(err)
    }
}

export const getUserPostsHandler: RequestHandler = async (req, res, next) => {
    const {
        limit: limitParam,
        before,
        after,
    } = req.query as {
        limit?: string
        before?: string
        after?: string
    }

    if (before && after) {
        return res
            .status(400)
            .json({ message: '只允许 after 或 before 中的一个' })
    }

    const limit = limitParam ? parseInt(limitParam) : 25

    try {
        const data = await postService.getUserPosts({
            user: req.user,
            limit,
            before,
            after,
        } as GetUserPostsArgs) // tech debts

        return res.json(data)
    } catch (err) {
        next(err)
    }
}

export const getPostHandler: RequestHandler = async (req, res, next) => {
    const { postId } = req.params

    try {
        const post = await postService.getPost(parseInt(postId))
        return res.json({ post })
    } catch (err) {
        if (isServiceFailure(err)) {
            if (err.name === PostServiceError.NO_RESOURCE) {
                return res.status(404).json({ message: err.message })
            }
        }
        next(err)
    }
}

export const createPostHandler: RequestHandler = async (req, res, next) => {
    const { communityId, title, body } = req.body

    if (!communityId) {
        return res.status(400).json({ message: '需要 communityId' })
    }
    if (!title) {
        return res.status(400).json({ message: '需要 title' })
    }

    try {
        const post = await postService.createPost({
            communityId,
            title,
            body,
            userId: req.user.id,
        })
        return res.status(201).json({ post })
    } catch (err) {
        next(err)
    }
}

export const updatePostHandler: RequestHandler = async (req, res, next) => {
    const { title, body } = req.body

    const { postId } = req.params

    if (!title && !body) {
        return res.status(400).json({ message: 'reqBody 需要 title 或 body' })
    }

    let post: Post
    try {
        post = await postService.getRawPost(parseInt(postId))
    } catch (err) {
        if (isServiceFailure(err)) {
            if (err.name === PostServiceError.NO_RESOURCE) {
                return res.status(404).json({ message: err.message })
            }
        }
        next(err)
        return
    }

    if (post.userId !== req.user.id) {
        return res.status(401).json({ message: 'Not owner' })
    }

    try {
        const updateArg = {
            id: post.id,
            title,
            body,
        }
        const updated = await postService.updatePost(updateArg)
        return res.json({ post: updated })
    } catch (err) {
        next(err)
    }
}
