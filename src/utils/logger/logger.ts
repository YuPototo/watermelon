/* istanbul ignore file */
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import config from '@/config'

export type LogLevel =
    | 'silent'
    | 'error'
    | 'warn'
    | 'info'
    | 'http'
    | 'verbose'
    | 'debug'
    | 'silly'

// npm debug levels (winston default):
// {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3
//   verbose: 4,
//   debug: 5,
//   silly: 6
// }

const stringifyObj = (
    info: winston.Logform.TransformableInfo,
    indent?: number
) => {
    if (info.message.constructor === Object) {
        info.message = JSON.stringify(info.message, null, indent)
    }
    return info
}

const prettyJson = (indent?: number) =>
    winston.format.printf((info) => {
        info = stringifyObj(info, indent)
        return `${info.timestamp} ${info.label || '-'} ${info.level}: ${
            info.message
        }`
    })

const toCsvFormat = winston.format.printf((info) => {
    info = stringifyObj(info)
    return `${info.timestamp},${info.level},${info.message}`
})

const httpOnly = winston.format((info) => {
    if (info.level !== 'http') {
        return false
    }
    return info
})

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.prettyPrint(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    prettyJson(4)
)

const errorLogFormat = winston.format.combine(
    winston.format.prettyPrint(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    prettyJson()
)

const httpLogFormat = winston.format.combine(
    httpOnly(),
    winston.format.prettyPrint(),
    winston.format.splat(),
    winston.format.simple(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    toCsvFormat
)

// transports
const httpTransport: DailyRotateFile = new DailyRotateFile({
    format: httpLogFormat,
    dirname: config.logger.httpLogDir,
    filename: 'http_%DATE%.log',
    datePattern: 'YYYYMMDD',
    maxSize: '20m',
    maxFiles: '30d',
    level: 'http',
})

const errorTransport: DailyRotateFile = new DailyRotateFile({
    format: errorLogFormat,
    dirname: config.logger.errorLogDir,
    filename: 'error_%DATE%.log',
    datePattern: 'YYYY_ww',
    maxSize: '20m',
    maxFiles: '8',
    level: 'error',
})

const transports = [
    new winston.transports.Console({ format: consoleFormat }),
    errorTransport,
    httpTransport,
]

const level =
    config.logger.loggerLevel === 'silent'
        ? undefined
        : config.logger.loggerLevel

export const logger = winston.createLogger({
    level,
    silent: config.logger.loggerLevel === 'silent',
    defaultMeta: { service: 'express_mongo' },
    transports,
})
