import morgan from 'morgan'
import morganBody from 'morgan-body'

import config from '@/config'
import logger from './index'

import type { Express } from 'express-serve-static-core'

const removeNewlineAtEnd = (msg: string) => {
    return msg.substring(0, msg.lastIndexOf('\n'))
}

const LOGGER_FORMAT =
    ':remote-addr,:method,:url,:status,:res[content-length],:response-time'

function useMorgan(app: Express) {
    app.use(
        morgan(LOGGER_FORMAT, {
            // specify a stream for requests logging
            stream: {
                write: (msg) => {
                    // https://www.titanwolf.org/Network/q/5c84bf29-ed66-4443-991f-e8ba44455db1/y
                    const msgWithoutNewline = removeNewlineAtEnd(msg)
                    logger.http(msgWithoutNewline)
                },
            },
        })
    )
}

export function useLog(app: Express) {
    if (config.logger.morgan) useMorgan(app)

    if (config.logger.morganBody) {
        morganBody(app)
    }
}
