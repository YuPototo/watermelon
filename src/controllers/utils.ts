// todo: rename
export interface ReturnableControllerObj {
    statusCode: number
    message: string
}

export const isReturnableControllerError = (
    err: unknown
): err is ReturnableControllerObj => {
    if (
        typeof err === 'object' &&
        err !== null &&
        'statusCode' in err &&
        'message' in err &&
        typeof (err as Record<string, unknown>).statusCode === 'number' &&
        typeof (err as Record<string, unknown>).message === 'string'
    ) {
        return true
    }
    return false
}
