import express, { Request, Response, NextFunction } from 'express'
import type { Express } from 'express-serve-static-core'
import cors from 'cors'
import helmet from 'helmet'

import logger, { useLog } from '@/utils/logger'

import userRouter from './routes/userRoute'
import logRouter from './routes/logRoute'
import communityRouter from './routes/communityRoute'
import communityUserRouter from './routes/communityUserRoute'
import postRouter from './routes/postRoute'
import commentRouter from './routes/commentRoute'

import { getErrorMessage } from './utils/err/errUtils'

const API_PREFIX = '/api'

export async function createApp(): Promise<Express> {
    const app = express()

    // middleware
    app.enable('trust proxy') // 使用 nginx proxy 时要用
    app.use(helmet()) // 若干开箱即用的安全措施
    app.use(cors()) // 允许跨域访问
    app.use(express.json()) // 保证 http request body 会被作为 json 传入
    useLog(app)

    // routes
    app.use(`${API_PREFIX}/users`, userRouter)
    app.use(`${API_PREFIX}/logs`, logRouter)
    app.use(`${API_PREFIX}/communities`, communityRouter)
    app.use(`${API_PREFIX}/communityUser`, communityUserRouter)
    app.use(`${API_PREFIX}/posts`, postRouter)
    app.use(`${API_PREFIX}/comments`, commentRouter)

    // Error-handling middleware: 必须使用 4个 argument
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        const errMessage = getErrorMessage(err)
        logger.error(errMessage)
        res.status(500).json({ message: errMessage })
    })
    return app
}
