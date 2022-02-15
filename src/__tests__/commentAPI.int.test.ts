import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../app'
import db from '../utils/db'
import userUtils from '../utils/testUtils/userUtils'
import { deleteAllData } from '../utils/testUtils/dbUtils'

let app: Express

const COMMUNITY = {
    id: 1,
    name: 'dota2',
}

const USER_ID = 1
const OTHER_USER = 2

const POST = {
    id: 1,
    title: 'post 1',
    userId: 1,
    communityId: 1,
}

let tokenOne: string
let tokenTwo: string

beforeAll(async () => {
    app = await createApp()

    await userUtils.createUser(USER_ID, 'test_user')
    await userUtils.createUser(OTHER_USER, 'test_user_2')
    await db.community.create({ data: COMMUNITY })
    await db.post.create({ data: POST })
    tokenOne = userUtils.createToken(USER_ID)
    tokenTwo = userUtils.createToken(OTHER_USER)
})

afterEach(async () => {
    await db.comment.deleteMany()
})

afterAll(async () => {
    await deleteAllData()
    await db.$disconnect()
})

describe('POST /comments', () => {
    it('should require auth', async () => {
        const res = await request(app).post('/api/comments')
        expect(res.status).toBe(401)
    })

    it('should check input', async () => {
        const resOne = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ body: '123' })

        expect(resOne.status).toBe(400)
        expect(resOne.body.message).toBe('缺少 postId 或 body')

        const resTwo = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ postId: 1 })

        expect(resTwo.status).toBe(400)
        expect(resTwo.body.message).toBe('缺少 postId 或 body')
    })

    it('should create comment', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ postId: 1, body: 'test body' })

        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('comment')

        const commentId = res.body.comment.id
        const commentFromDB = await db.comment.findUnique({
            where: { id: commentId },
        })
        expect(commentFromDB).not.toBeNull()
    })

    it('should return the right format', async () => {
        const res = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ postId: 1, body: 'test body' })

        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('comment')
        expect(res.body.comment).toMatchObject({
            id: expect.any(Number),
            body: 'test body',
            postId: 1,
            user: {
                id: USER_ID,
                userName: 'test_user',
            },
        })
    })
})

describe('PATCH /comments/:id', () => {
    it('should require auth', async () => {
        const res = await request(app).patch('/api/comments/1')
        expect(res.status).toBe(401)
    })

    it('should check input', async () => {
        const res = await request(app)
            .patch('/api/comments/1')
            .set('Authorization', `Bearer ${tokenOne}`)

        expect(res.status).toBe(400)
        expect(res.body.message).toMatch(/缺少 body/)
    })

    it('should return 404 when comment not found', async () => {
        const res = await request(app)
            .patch('/api/comments/9999')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ body: 'new body' })

        expect(res.status).toBe(404)
    })

    it('should return 401 when user not own comment', async () => {
        const resOne = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenTwo}`)
            .send({ postId: 1, body: 'test body from user 2' })
        const commentId = resOne.body.comment.id

        const resTwo = await request(app)
            .patch(`/api/comments/${commentId}`)
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ body: 'new body' })
        expect(resTwo.status).toBe(401)
    })

    it('should update comments', async () => {
        const resOne = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ postId: 1, body: 'test body' })
        const commentId = resOne.body.comment.id

        const resTwo = await request(app)
            .patch(`/api/comments/${commentId}`)
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ body: 'new body' })
        expect(resTwo.status).toBe(200)
        expect(resTwo.body).toHaveProperty('comment')
        expect(resTwo.body.comment).toMatchObject({
            id: expect.any(Number),
            body: 'new body',
            postId: expect.any(Number),
            user: {
                id: USER_ID,
                userName: 'test_user',
            },
        })
    })
})

describe('GET /posts/:postId/comments', () => {
    it('should return 200 even with no comments', async () => {
        const postId = 1
        const res = await request(app).get(`/api/posts/${postId}/comments`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('comments')
        expect(res.body.comments).toMatchObject([])
    })

    it('should return comments', async () => {
        const postId = 1

        await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenOne}`)
            .send({ postId: 1, body: 'first comment' })

        await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${tokenTwo}`)
            .send({ postId: 1, body: 'second comment' })

        const res = await request(app).get(`/api/posts/${postId}/comments`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('comments')
        expect(res.body.comments).toHaveLength(2)
        expect(res.body.comments[0]).toMatchObject({
            id: expect.any(Number),
            body: expect.any(String),
            postId,
            user: {
                id: expect.any(Number),
                userName: expect.any(String),
            },
        })

        // 新的 post 在后面
        expect(res.body.comments[0]).toMatchObject({
            body: 'first comment',
        })
    })
})
