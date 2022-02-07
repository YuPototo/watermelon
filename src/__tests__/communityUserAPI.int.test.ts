import request from 'supertest'
import { Express } from 'express-serve-static-core'

import { createApp } from '../app'
import db from '../utils/db'
import userUtils from '../utils/testUtils/userUtils'

let app: Express

const COMMUNITY = {
    name: 'dota2',
}
const USER_ID = 1

let communityId: number
let token: string

beforeAll(async () => {
    app = await createApp()

    const community = await db.community.create({ data: COMMUNITY })
    communityId = community.id

    await userUtils.createUser(USER_ID)
    token = userUtils.createToken(USER_ID)
})

afterAll(async () => {
    const deleteUser = db.user.deleteMany()
    const deleteCommunity = db.community.deleteMany()
    await db.$transaction([deleteUser, deleteCommunity])
    await db.$disconnect()
})

afterEach(async () => {
    await db.communityUser.deleteMany()
})

describe('PUT /communityUser/:id', () => {
    it('should require auth', async () => {
        const res = await request(app).put(`/api/communityUser/${communityId}`)
        expect(res.statusCode).toBe(401)
    })

    it('should create a record and return 201', async () => {
        const res = await request(app)
            .put(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(201)

        const record = await db.communityUser.findUnique({
            where: {
                userId_communityId: {
                    userId: USER_ID,
                    communityId,
                },
            },
        })
        expect(record).not.toBeNull()
    })

    it('should allow duplicate request', async () => {
        const resOne = await request(app)
            .put(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(resOne.statusCode).toBe(201)

        const resTwo = await request(app)
            .put(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(resTwo.statusCode).toBe(201)

        const record = await db.communityUser.findUnique({
            where: {
                userId_communityId: {
                    userId: USER_ID,
                    communityId,
                },
            },
        })
        expect(record).not.toBeNull()
    })
})

describe('DELETE /communityUser/:id', () => {
    it('should require auth', async () => {
        const res = await request(app).delete(
            `/api/communityUser/${communityId}`
        )
        expect(res.statusCode).toBe(401)
    })

    it('should delete record and return 200', async () => {
        await request(app)
            .put(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)

        const recordBeforeDelete = await db.communityUser.findUnique({
            where: {
                userId_communityId: {
                    userId: USER_ID,
                    communityId,
                },
            },
        })
        expect(recordBeforeDelete).not.toBeNull()

        const res = await request(app)
            .delete(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)

        const recordAfterDelete = await db.communityUser.findUnique({
            where: {
                userId_communityId: {
                    userId: USER_ID,
                    communityId,
                },
            },
        })
        expect(recordAfterDelete).toBeNull()
    })

    it('should allow delete a non-exist resource', async () => {
        const res = await request(app)
            .delete(`/api/communityUser/${communityId}`)
            .set('Authorization', `Bearer ${token}`)
        expect(res.statusCode).toBe(200)
    })
})
