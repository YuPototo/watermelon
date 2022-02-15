import { RequestHandler } from 'express'

import commentService, { CommentServiceError } from '@/services/commentService'

import { isServiceFailure } from '@/services/utils'
import { Comment } from '@/utils/db'

export const createCommentHandler: RequestHandler = async (req, res, next) => {
    const { postId, body } = req.body as { postId: unknown; body: unknown }
    if (!postId || !body) {
        return res.status(400).json({ message: '缺少 postId 或 body' })
    }

    if (typeof postId !== 'number') {
        return res.status(400).json({ message: 'postId 必须是 number' })
    }

    if (typeof body !== 'string') {
        return res.status(400).json({ message: 'body 必须是 string' })
    }

    try {
        const comment = await commentService.createComment({
            postId,
            body,
            userId: req.user.id,
        })
        return res.status(201).json({ comment })
    } catch (err) {
        return next(err)
    }
}

export const updateCommentHandler: RequestHandler = async (req, res, next) => {
    const { body } = req.body as { body: unknown }

    if (!body) {
        return res.status(400).json({ message: '缺少 body' })
    }

    if (typeof body !== 'string') {
        return res.status(400).json({ message: 'body 必须是 string' })
    }

    const { id } = req.params

    let comment: Comment
    try {
        comment = await commentService.getRawComment(parseInt(id))
    } catch (err) {
        if (isServiceFailure(err)) {
            if (err.name === CommentServiceError.NO_RESOURCE) {
                return res.status(404).json({ message: err.message })
            }
        }
        next(err)
        return
    }

    if (comment.userId !== req.user.id) {
        return res.status(401).json({ message: 'Not owner' })
    }

    try {
        const updateArg = {
            id: comment.id,
            body,
        }
        const updated = await commentService.updateComment(updateArg)
        return res.json({ comment: updated })
    } catch (err) {
        next(err)
    }
}

export const getCommentsHandler: RequestHandler = async (req, res, next) => {
    const { postId } = req.params

    try {
        const comments = await commentService.getComments(parseInt(postId))
        return res.json({ comments })
    } catch (err) {
        next(err)
    }
}
