import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import { Request, Response } from 'express'
import { MetricsService } from './metrics.service'

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>()
    const res = context.switchToHttp().getResponse<Response>()

    return next.handle().pipe(
      tap(() => {
        this.metricsService.httpRequestsTotal.inc({
          method: req.method,
          route: req.route?.path ?? req.path,
          status_code: String(res.statusCode),
        })
      }),
    )
  }
}
