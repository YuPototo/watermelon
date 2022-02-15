import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../../app'
import db from '../../utils/db'

import testUserUtils from '../../utils/testUtils/userUtils'
import { deleteAllData } from '../../utils/testUtils/dbUtils'

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

    await testUserUtils.createUser(USER_ID, USER_NAME)
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

describe('GET /posts/community/:id/new 翻页', () => {
    it('should have hasNext and hasPrev in res body', async () => {
        const res = await request(app).get('/api/posts/community/1/new')
        expect(res.body).toHaveProperty('hasNext')
        expect(res.body).toHaveProperty('hasPrev')
    })

    it('should return hasNext as true when there is next page', async () => {
        // 只获取第1个 post 时，后面还有 post
        const res = await request(app).get('/api/posts/community/1/new?limit=1')
        expect(res.body.hasNext).toBeTruthy()
    })

    it('should return hasNext as false when there is no next page', async () => {
        // 获取全部4个 post，没有下一页了
        const res = await request(app).get('/api/posts/community/1/new')
        expect(res.body.hasNext).toBeFalsy()

        // 获取第2个 post 后面的一个 post，即 post 1，然后就没有了
        const res2 = await request(app).get(
            '/api/posts/community/1/new?after=2&limit=1'
        )
        expect(res2.body.hasNext).toBeFalsy()
    })

    it('should return hasPrev as true when there is prev page', async () => {
        // 获取到3号帖子之前的帖子：帖子4。再往前还有帖子5
        const res = await request(app).get(
            '/api/posts/community/1/new?before=3&limit=1'
        )
        expect(res.body.hasPrev).toBeTruthy()
    })

    it('should return hasPrev as false when there is no prev page', async () => {
        // 获取所有posts
        const res = await request(app).get('/api/posts/community/1/new')
        expect(res.body.hasPrev).toBeFalsy()

        // 获取4号 post 前面的post，即5号 post。不再有前一页。
        const res2 = await request(app).get(
            '/api/posts/community/1/new?before=4'
        )
        expect(res2.body.hasPrev).toBeFalsy()
    })
})
