import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import * as cookieParser from 'cookie-parser'
import * as fs from 'fs'
import { GlobalExceptionFilter } from './common/globalExceptionFilter'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const sslEnabled = process.env.SSL_ENABLED === 'true'
  const httpsOptions = sslEnabled
    ? {
        key: fs.readFileSync('/certs/server.key'),
        cert: fs.readFileSync('/certs/server.crt'),
      }
    : undefined

  const app = await NestFactory.create(AppModule, {
    ...(httpsOptions ? { httpsOptions } : {}),
  })
  const configService = new ConfigService()
  app.enableCors({
    origin: configService.getOrThrow<string>('CORS_ORIGIN'),
    credentials: true,
  })
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.use(cookieParser())
  await app.listen(process.env.PORT ?? 4000)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
