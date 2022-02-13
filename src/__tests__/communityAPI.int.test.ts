import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../app'
import db from '../utils/db'

let app: Express

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

beforeAll(async () => {
    app = await createApp()

    await db.community.createMany({ data: COMMUNITIES })
})

afterAll(async () => {
    const deleteUser = db.user.deleteMany()
    const deleteCommunity = db.community.deleteMany()
    await db.$transaction([deleteUser, deleteCommunity])
    await db.$disconnect()
})

describe('GET /communities', () => {
    it('should return 200', async () => {
        const res = await request(app).get('/api/communities')
        expect(res.statusCode).toBe(200)
    })

    it('should return community lists', async () => {
        const res = await request(app).get('/api/communities')
        expect(res.body).toHaveProperty('communities')
        expect(res.body.communities).toHaveLength(2)
        expect(res.body.communities).toEqual([
            {
                id: expect.any(Number),
                name: 'dota2',
            },
            {
                id: expect.any(Number),
                name: '足球',
            },
        ])
    })
})

describe('GET /communities/:id', () => {
    it('should return 404 when not found', async () => {
        const res = await request(app).get('/api/communities/99')
        expect(res.status).toBe(404)
    })

    it('should return 200', async () => {
        const res = await request(app).get('/api/communities/1')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('community')
        expect(res.body.community).toEqual({
            id: 1,
            name: 'dota2',
        })
    })
})
