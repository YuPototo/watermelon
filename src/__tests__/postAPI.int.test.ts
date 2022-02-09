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

const POSTS = [
    {
        id: 1,
        title: 'post 1',
        userId: 1,
        communityId: 1,
    },
    {
        id: 2,
        title: 'post 2',
        userId: 1,
        communityId: 1,
    },
]

let app: Express
let token: string

beforeAll(async () => {
    app = await createApp()
    token = testUserUtils.createToken(USER_ID)
    await testUserUtils.createUser(USER_ID, 'test_user')
    await db.community.createMany({ data: COMMUNITIES })
    await db.post.createMany({ data: POSTS })
})

afterAll(async () => {
    await deleteAllData()
})

describe('GET /posts/:postId', () => {
    it('return a post', async () => {
        const res = await request(app).get('/api/posts/1')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('post')
        expect(res.body.post).toMatchObject({
            id: 1,
            title: 'post 1',
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
        const res = await request(app).get('/api/posts/30')
        expect(res.statusCode).toBe(404)
    })
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
