import { RequestHandler } from 'express'
import postService from '@/services/postService'

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

    if (before && after) {
        return res
            .status(400)
            .json({ message: '只允许 after 或 before 中的一个' })
    }

    try {
        const posts = await postService.getAllPosts({ limit, before, after })
        return res.json({ posts })
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
        const posts = await postService.getCommunityPosts({
            communityId: parseInt(communityId),
            limit,
            before,
            after,
        })

        return res.json({ posts })
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
        const posts = await postService.getUserPosts({
            user: req.user,
            limit,
            before,
            after,
        })

        return res.json({ posts })
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