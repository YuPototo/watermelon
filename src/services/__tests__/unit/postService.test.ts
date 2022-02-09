import { createCursor } from '../../postService'

describe('createCursor()', () => {
    it('return cursor when before provided', () => {
        expect(createCursor({ before: '1' })).toEqual({ id: 1 })
    })

    it('return cursor when after provided', () => {
        expect(createCursor({ after: '2' })).toEqual({ id: 2 })
    })

    it('return undefined when before and after are undefined', () => {
        expect(createCursor({ before: undefined, after: undefined })).toEqual(
            undefined
        )
    })
})
