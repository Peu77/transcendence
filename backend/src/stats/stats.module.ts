import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserStats } from './user-stats.entity'
import { StatsService } from './stats.service'
import { StatsController } from './stats.controller'

@Module({
  imports: [TypeOrmModule.forFeature([UserStats])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
