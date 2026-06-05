import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { PublicApiService } from './public-api.service'

@Injectable()
export class PublicApiGuard implements CanActivate {
  constructor(private readonly publicApiService: PublicApiService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = this.extractApiKey(request)

    if (!apiKey) throw new UnauthorizedException('Missing API key')

    request.publicApiKey = await this.publicApiService.authenticate(apiKey)
    return true
  }

  private extractApiKey(request: Request) {
    const headerKey = request.header('x-api-key')
    if (headerKey) return headerKey

    const authorization = request.header('authorization')
    if (!authorization) return null

    const [scheme, token] = authorization.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null

    return token
  }
}
