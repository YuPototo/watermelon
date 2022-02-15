import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../app'
import db from '../utils/db'

import testUserUtils from '../utils/testUtils/userUtils'
import { deleteAllData } from '../utils/testUtils/dbUtils'

const USER_ID = 1
const COMMUNITIES = [
    {
        id: 1,
        name: 'dota2',
    },
]

let app: Express
let token: string

beforeAll(async () => {
    app = await createApp()
    token = testUserUtils.createToken(USER_ID)
    await testUserUtils.createUser(USER_ID, 'test_user')
    await db.community.createMany({ data: COMMUNITIES })
})

afterAll(async () => {
    await deleteAllData()
    await db.$disconnect()
})

describe('POST /posts', () => {
    it('require auth', async () => {
        const res = await request(app).post('/api/posts')
        expect(res.statusCode).toBe(401)
    })

    it('should check request body: title and community required', async () => {
        const res1 = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
        expect(res1.statusCode).toBe(400)

        const res2 = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'test title' })
        expect(res2.statusCode).toBe(400)
        expect(res2.body.message).toMatch(/communityId/i)

        const res3 = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1 })
        expect(res3.statusCode).toBe(400)
        expect(res3.body.message).toMatch(/title/i)
    })

    it('should create a post and return 201', async () => {
        const res = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1, title: 'test title' })
        expect(res.statusCode).toBe(201)
        expect(res.body).toHaveProperty('post')
        const expectedObj = {
            id: expect.any(Number),
            title: 'test title',
            commentCount: 0,
            user: {
                id: expect.any(Number),
                userName: expect.any(String),
            },
            community: {
                id: expect.any(Number),
                name: expect.any(String),
            },
        }
        expect(res.body.post).toMatchObject(expectedObj)

        const postId = res.body.post.id
        const res2 = await request(app).get(`/api/posts/${postId}`)
        expect(res2.status).toBe(200)
        expect(res2.body.post).toMatchObject(expectedObj)
    })
})

describe('GET /posts/:postId', () => {
    it('return a post', async () => {
        const resOne = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1, title: 'test title' })
        const postId = resOne.body.post.id

        const resTwo = await request(app).get(`/api/posts/${postId}`)
        expect(resTwo.statusCode).toBe(200)
        expect(resTwo.body).toHaveProperty('post')
        expect(resTwo.body.post).toMatchObject({
            id: postId,
            title: 'test title',
            commentCount: 0,
            user: {
                id: expect.any(Number),
                userName: expect.any(String),
            },
            community: {
                id: expect.any(Number),
                name: expect.any(String),
            },
        })
    })

    it('return 404 when no post found', async () => {
        const res = await request(app).get('/api/posts/999')
        expect(res.statusCode).toBe(404)
    })

    it('return comment counts', async () => {
        const resOne = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1, title: 'test title' })
        const postId = resOne.body.post.id

        await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({ postId, body: 'test body' })

        await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({ postId, body: 'test body' })

        const resTwo = await request(app).get(`/api/posts/${postId}`)
        expect(resTwo.statusCode).toBe(200)
        expect(resTwo.body.post).toMatchObject({
            commentCount: 2,
        })
    })
})

describe('PATCH /posts/:postId', () => {
    it('should require auth', async () => {
        const res = await request(app).patch('/api/posts/1')
        expect(res.statusCode).toBe(401)
    })

    it('should return 400 when request body contains no right field', async () => {
        const res = await request(app)
            .patch('/api/posts/1')
            .set('Authorization', `Bearer ${token}`)

        expect(res.statusCode).toBe(400)
    })

    it('should return 401 when user does not own resource', async () => {
        const USER_TWO_ID = 99
        await testUserUtils.createUser(USER_TWO_ID, 'user_two')
        const otherToken = testUserUtils.createToken(USER_TWO_ID)

        const resOne = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1, title: 'test title' })
        const postId = resOne.body.post.id

        const res = await request(app)
            .patch(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${otherToken}`)
            .send({ title: 'new' })

        expect(res.statusCode).toBe(401)
    })

    // 404
    it('should return 404 when resource not exists', async () => {
        const res = await request(app)
            .patch('/api/posts/99')
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'new' })

        expect(res.statusCode).toBe(404)
    })

    // update
    it('should update post', async () => {
        const createRes = await request(app)
            .post('/api/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({ communityId: 1, title: 'test title', body: 'test body' })

        const postId = createRes.body.post.id

        const res1 = await request(app)
            .patch(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'new title' })
        expect(res1.statusCode).toBe(200)
        expect(res1.body.post).toMatchObject({
            commentCount: 0,
            title: 'new title',
            body: 'test body',
        })

        const res2 = await request(app)
            .patch(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ body: 'new body' })
        expect(res2.statusCode).toBe(200)
        expect(res2.body.post).toMatchObject({
            title: 'new title',
            body: 'new body',
        })

        const res3 = await request(app)
            .patch(`/api/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ title: 'new title 2', body: 'new body 2' })
        expect(res3.statusCode).toBe(200)
        expect(res3.body.post).toMatchObject({
            title: 'new title 2',
            body: 'new body 2',
        })
    })
})
