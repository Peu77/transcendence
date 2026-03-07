import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import {
  CannotCreateEntityIdMapError,
  EntityNotFoundError,
  QueryFailedError,
} from 'typeorm'
import { Request, Response } from 'express'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response: Response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status: HttpStatus
    let message: any = (exception as any)?.message ?? 'Internal server error'
    let code: any = (exception as any)?.name ?? 'Error'
    let details: any = undefined

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = exception.name

      const resBody = exception.getResponse()

      if (typeof resBody === 'string') {
        message = resBody
      } else if (resBody && typeof resBody === 'object') {
        const body: any = resBody
        if (Array.isArray(body.message)) {
          message = body.message.join(', ')
          details = body.message
        } else if (typeof body.message === 'string') {
          message = body.message
        } else {
          message = body.error ?? body.message ?? exception.message
        }

        if (typeof body.error === 'string') {
          code = body.error
        }

        const extraKeys = Object.keys(body).filter(
          (k) => !['statusCode', 'message', 'error'].includes(k),
        )
        if (extraKeys.length > 0) {
          details = details ?? {}
          for (const k of extraKeys) (details as any)[k] = body[k]
        }
      } else {
        message = exception.message
      }

      Logger.error(message, `${request.method} ${request.url}`)

      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        message,
        code,
        ...(details === undefined ? {} : { details }),
        path: request.url,
        method: request.method,
      })
      return
    }

    switch ((exception as any)?.constructor) {
      case QueryFailedError:
        status = HttpStatus.UNPROCESSABLE_ENTITY
        message = (exception as QueryFailedError).message
        code = (exception as any).code
        break
      case EntityNotFoundError:
        status = HttpStatus.UNPROCESSABLE_ENTITY
        message = (exception as EntityNotFoundError).message
        code = (exception as any).code
        break
      case CannotCreateEntityIdMapError:
        status = HttpStatus.UNPROCESSABLE_ENTITY
        message = (exception as CannotCreateEntityIdMapError).message
        code = (exception as any).code
        break
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR
        Logger.error(
          message,
          (exception as any).stack,
          `${request.method} ${request.url}`,
        )
        break
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      message,
      code,
      path: request.url,
      method: request.method,
    })
  }
}
