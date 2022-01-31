import { PrismaClient } from '@prisma/client'

export { User } from '@prisma/client'

const prisma = new PrismaClient()

export default prisma
