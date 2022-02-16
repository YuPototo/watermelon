import db, { Comment } from '@/utils/db'

export enum CommentServiceError {
    NO_RESOURCE = 'no_resouce',
}

interface CreateCommentArg {
    postId: number
    body: string
    userId: number
}

const createComment = async ({ postId, body, userId }: CreateCommentArg) => {
    const comment = await db.comment.create({ data: { postId, userId, body } })
    return await commentToOutput(comment)
}

const getRawComment = async (id: number) => {
    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) {
        throw {
            name: CommentServiceError.NO_RESOURCE,
            message: '找不到 Comment',
        }
    }
    return comment
}

type UpdateCommentArg = {
    id: number
    body: string
}
const updateComment = async ({ id, body }: UpdateCommentArg) => {
    const comment = await db.comment.update({ where: { id }, data: { body } })
    return await commentToOutput(comment)
}

const commentToOutput = async (comment: Comment) => {
    const user = await db.user.findUnique({ where: { id: comment.userId } })
    if (user === null) {
        throw new Error(`找不到 user ${comment.userId}`)
    }
    return {
        id: comment.id,
        body: comment.body,
        postId: comment.postId,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: { id: user.id, userName: user.userName },
    }
}

const getComments = async (postId: number) => {
    const comments = await db.comment.findMany({
        where: { postId },
        orderBy: {
            createdAt: 'asc',
        },
    })
    const output = []
    for (const comment of comments) {
        const commentOut = await commentToOutput(comment)
        output.push(commentOut)
    }
    return output
}

export default {
    createComment,
    getRawComment,
    updateComment,
    getComments,
}
