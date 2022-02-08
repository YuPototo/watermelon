export interface ServiceFailure {
    name: string
    message: string
}

export const isServiceFailure = (err: unknown): err is ServiceFailure => {
    if (
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        'message' in err &&
        typeof (err as Record<string, unknown>).message === 'string' &&
        typeof (err as Record<string, unknown>).name === 'string'
    ) {
        return true
    }
    return false
}

interface CommunityId {
    communityId: number
}

interface CommunityOrQuery {
    OR: CommunityId[]
}

export const communityQueryBuilder = (
    communityIds: number[]
): CommunityOrQuery => {
    return {
        OR: communityIds.map((id) => ({ communityId: id })),
    }
}
