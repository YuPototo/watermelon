import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../../app'
import db from '../../utils/db'

import testUserUtils from '../../utils/testUtils/userUtils'
import { deleteAllData } from '../../utils/testUtils/dbUtils'

const USER_ID = 1
const COMMUNITIES = [
    {
        id: 1,
        name: 'dota2',
    },
    {
        id: 2,
        name: '足球',
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
        communityId: 2,
    },
    {
        id: 3,
        title: 'post 3',
        userId: 1,
        communityId: 1,
    },
    {
        id: 4,
        title: 'post 4',
        userId: 1,
        communityId: 1,
    },
    {
        id: 5,
        title: 'post 5',
        userId: 1,
        communityId: 1,
    },
]

const createPosts = async () => {
    for (const post of POSTS) {
        await db.post.create({ data: post })
        // 最终的 post 顺序应该是 5-4-3-2-1
    }
}

let app: Express

beforeAll(async () => {
    app = await createApp()

    await testUserUtils.createUser(USER_ID, 'test_user')
    await db.community.createMany({ data: COMMUNITIES })
    await createPosts()
})

afterAll(async () => {
    await deleteAllData()
})

describe('GET /posts/community/:id/new', () => {
    /*
        community 1 有4个帖子，ID分别是：1, 3, 4, 5
        加入的时间顺序也是 1，3，4，5
    */
    it('should return post lists from community', async () => {
        const res = await request(app).get('/api/posts/community/1/new')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('posts')
        expect(res.body.posts).toHaveLength(4)
    })

    it('should accept limit query', async () => {
        const res = await request(app).get('/api/posts/community/1/new?limit=1')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })

    it('should accept before query', async () => {
        // 3 前面是 4和5
        const res = await request(app).get(
            '/api/posts/community/1/new?before=3'
        )
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should accept after query', async () => {
        // 4 的后面是 3、1
        const res = await request(app).get('/api/posts/community/1/new?after=4')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should accept before and limit', async () => {
        const res = await request(app).get(
            '/api/posts/community/1/new?befor=4&limit=1'
        )
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })

    it('should accept after and limit', async () => {
        const res = await request(app).get(
            '/api/posts/community/1/new?after=3&limit=1'
        )
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })
})
