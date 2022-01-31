// https://dev.to/kwabenberko/extend-express-s-request-object-with-typescript-declaration-merging-1nn5
import { IUSer } from '../../src/models/user'

declare global {
    namespace Express {
        interface Request {
            user: IUser
        }
    }
}
