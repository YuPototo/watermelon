import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../../app'
import db from '../../utils/db'

import testUserUtils from '../../utils/testUtils/userUtils'
import { deleteAllData } from '../../utils/testUtils/dbUtils'

/*
    3个社区
    6个帖子
    用户加入了社区1和2
    来自社区1和2的帖子分别是 1、2、4、5
*/

const USER_ID = 1
const USER_NAME = 'test_user'
const COMMUNITIES = [
    {
        id: 1,
        name: 'dota2',
    },
    {
        id: 2,
        name: '足球',
    },
    {
        id: 3,
        name: 'JavaScript',
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
        communityId: 3,
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
        communityId: 2,
    },
    {
        id: 6,
        title: 'post 5',
        userId: 1,
        communityId: 3,
    },
]

const createPosts = async () => {
    for (const post of POSTS) {
        await db.post.create({ data: post })
    }
}

let app: Express
let token: string

beforeAll(async () => {
    app = await createApp()

    await testUserUtils.createUser(USER_ID, USER_NAME)
    await db.community.createMany({ data: COMMUNITIES })
    await createPosts()
    token = testUserUtils.createToken(USER_ID)
})

afterAll(async () => {
    await deleteAllData()
})

describe('GET /posts/me/new', () => {
    beforeAll(async () => {
        // 用户加入社区1和2
        await request(app)
            .put('/api/communityUser/1')
            .set('Authorization', `Bearer ${token}`)
        await request(app)
            .put('/api/communityUser/2')
            .set('Authorization', `Bearer ${token}`)
    })

    it('require auth', async () => {
        const res = await request(app).get('/api/posts/me/new')
        expect(res.statusCode).toBe(401)
    })

    it('return posts from communities joined by user', async () => {
        const res = await request(app)
            .get('/api/posts/me/new')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('posts')
        expect(res.body.posts).toHaveLength(4)

        expect(res.body.posts[0]).toMatchObject({
            id: expect.any(Number),
            title: expect.any(String),
            commentCount: expect.any(Number),
            user: {
                id: USER_ID,
                userName: USER_NAME,
            },
            community: {
                id: expect.any(Number),
                name: expect.any(String),
            },
        })
    })

    it('should accept limit as query', async () => {
        const res = await request(app)
            .get('/api/posts/me/new?limit=2')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should accept before as query', async () => {
        // 在帖子2前面的是：4、5
        const res = await request(app)
            .get('/api/posts/me/new?before=2')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should accept after as query', async () => {
        // 在帖子4后面的是：2, 1
        const res = await request(app)
            .get('/api/posts/me/new?after=4')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should accept after and limit', async () => {
        const res = await request(app)
            .get('/api/posts/me/new?after=4&limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })

    it('should accept before and limit', async () => {
        const res = await request(app)
            .get('/api/posts/me/new?before=2&limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })
})

describe('GET /posts/me/new 翻页', () => {
    it('should have hasNext and hasPrev in res body', async () => {
        const res = await request(app)
            .get('/api/posts/me/new')
            .set('Authorization', `Bearer ${token}`)

        expect(res.body).toHaveProperty('hasNext')
        expect(res.body).toHaveProperty('hasPrev')
    })

    it('should return hasNext as true when there is next page', async () => {
        // 只获取第1个 post 时，后面还若干个 post
        const res = await request(app)
            .get('/api/posts/me/new?limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res.body.hasNext).toBeTruthy()
    })

    it('should return hasNext as false when there is no next page', async () => {
        // 获取全部 post，没有下一页了
        const res = await request(app)
            .get('/api/posts/me/new')
            .set('Authorization', `Bearer ${token}`)
        expect(res.body.hasNext).toBeFalsy()

        // 获取最后一个 post，没有下一页了
        const res2 = await request(app)
            .get('/api/posts/me/new?after=2&limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res2.body.hasNext).toBeFalsy()
    })

    it('should return hasPrev as true when there is prev page', async () => {
        // 获取2号 post 之前的4号帖子
        const res = await request(app)
            .get('/api/posts/me/new?before=2&limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res.body.hasPrev).toBeTruthy()
    })

    it('should return hasPrev as false when there is no prev page', async () => {
        // 获取所有posts
        const res = await request(app)
            .get('/api/posts/me/new')
            .set('Authorization', `Bearer ${token}`)
        expect(res.body.hasPrev).toBeFalsy()

        // 获取4号 post 前面的post，即5号 post。不再有前一页。
        const res2 = await request(app)
            .get('/api/posts/me/new?before=4&limit=1')
            .set('Authorization', `Bearer ${token}`)
        expect(res2.body.hasPrev).toBeFalsy()
    })
})
