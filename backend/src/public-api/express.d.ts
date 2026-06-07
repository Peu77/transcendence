import { AuthenticatedApiKey } from './public-api.types'

declare global {
  namespace Express {
    interface Request {
      publicApiKey?: AuthenticatedApiKey
    }
  }
}
