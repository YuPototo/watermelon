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
        // post 按发帖时间排序时，顺序是 5-4-3-2-1
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

describe('GET /posts/all/new', () => {
    it('return post lists from all sites', async () => {
        const res = await request(app).get('/api/posts/all/new')
        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty('posts')
        expect(res.body.posts).toHaveLength(5) // 测试数据库里只有4个 posts
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

    it('should return new post in front', async () => {
        await db.post.create({
            data: {
                id: 99,
                title: 'new post',
                userId: 1,
                communityId: 1,
            },
        })

        const res = await request(app).get('/api/posts/all/new')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts[0]).toMatchObject({
            id: 99,
            title: 'new post',
            user: {
                id: USER_ID,
                userName: USER_NAME,
            },
            commentCount: expect.any(Number),
            community: {
                id: expect.any(Number),
                name: expect.any(String),
            },
        })

        await db.post.delete({ where: { id: 99 } })
    })

    it('should allow limit query', async () => {
        const res = await request(app).get('/api/posts/all/new?limit=2')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should allow after query', async () => {
        // 3 后面应该有 2 和 1
        const res = await request(app).get('/api/posts/all/new?after=3')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })

    it('should allow before query', async () => {
        // 3前面应该有4和5
        const res = await request(app).get('/api/posts/all/new?before=3')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)

        // 2前面应该有3、4、5
        const res2 = await request(app).get('/api/posts/all/new?before=2')
        expect(res2.statusCode).toBe(200)
        expect(res2.body.posts).toHaveLength(3)
    })

    it('should only allow one of before and after', async () => {
        const res = await request(app).get(
            '/api/posts/all/new?before=2&after=1'
        )
        expect(res.statusCode).toBe(400)
        expect(res.body.message).toBe('只允许 after 或 before 中的一个')
    })

    it('should allow after and limit', async () => {
        const res = await request(app).get('/api/posts/all/new?limit=1&after=4')
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(1)
    })

    it('should allow before and limit', async () => {
        const res = await request(app).get(
            '/api/posts/all/new?limit=2&before=1'
        )
        expect(res.statusCode).toBe(200)
        expect(res.body.posts).toHaveLength(2)
    })
})

describe('GET /posts/all/new 翻页', () => {
    it('should have hasNext and hasPrev in res body', async () => {
        const res = await request(app).get('/api/posts/all/new?limit=1&after=2')
        expect(res.body).toHaveProperty('hasNext')
        expect(res.body).toHaveProperty('hasPrev')
    })

    it('should return hasNext as true when there is next page', async () => {
        // 只获取第1个 post 时，后面还有4个post
        const res = await request(app).get('/api/posts/all/new?limit=1')
        expect(res.body.hasNext).toBeTruthy()
    })

    it('should return hasNext as false when there is no next page', async () => {
        // 获取全部5个 post，没有下一页了
        const res = await request(app).get('/api/posts/all/new')
        expect(res.body.hasNext).toBeFalsy()

        // 获取最后一个 post，没有下一页了
        const res2 = await request(app).get('/api/posts/all/new?after=4')
        expect(res2.body.hasNext).toBeFalsy()
    })

    it('should return hasPrev as true when there is prev page', async () => {
        // 获取3号 post 后面的 post
        const res = await request(app).get('/api/posts/all/new?after=3')
        expect(res.body.hasPrev).toBeTruthy()
    })

    it('should return hasPrev as false when there is no prev page', async () => {
        // 获取所有5个posts
        const res = await request(app).get('/api/posts/all/new')
        expect(res.body.hasPrev).toBeFalsy()

        // 获取4号 post 前面的post，即5号 post。不再有前一页。
        const res2 = await request(app).get('/api/posts/all/new?before=4')
        expect(res2.body.hasPrev).toBeFalsy()
    })
})
