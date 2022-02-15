import { PrismaClient } from '@prisma/client'

export { User, Post, Comment } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
