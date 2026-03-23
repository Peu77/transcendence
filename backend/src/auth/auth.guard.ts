import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { verify } from 'jsonwebtoken'

export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.userId
  },
)

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string

  constructor(configService: ConfigService) {
    this.jwtSecret = configService.getOrThrow<string>('JWT_SECRET')
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const isAuthRoute = request.url.startsWith('/auth/')
    if (isAuthRoute) return true

    const token = request.cookies?.token
    try {
      const decoded: any = verify(token || '', this.jwtSecret)
      if (!decoded || typeof decoded === 'string' || !decoded.userId)
        return false

      request.userId = decoded.userId
      return true
    } catch {
      throw new UnauthorizedException('Unauthorized')
    }
  }
}
