import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserPresence } from '../friends/entities/user-presence.entity'
import { MatchResult } from '../users/match-result.entity'
import { User } from '../users/user.entity'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPresence, MatchResult])],
  controllers: [MetricsController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
