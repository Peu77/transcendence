import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserStats } from './user-stats.entity'
import { StatsService } from './stats.service'
import { StatsController } from './stats.controller'
import { MatchResult } from '../users/match-result.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserStats, MatchResult])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
