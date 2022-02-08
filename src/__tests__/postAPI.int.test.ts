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

beforeAll(async () => {
    app = await createApp()

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
            userId: expect.any(Number),
            communityId: expect.any(Number),
        })
    })
})
