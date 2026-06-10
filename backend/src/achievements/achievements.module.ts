import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserAchievement } from './user-achievement.entity'
import { AchievementsService } from './achievements.service'
import { AchievementsController } from './achievements.controller'
import { StatsModule } from '../stats/stats.module'

@Module({
  imports: [TypeOrmModule.forFeature([UserAchievement]), StatsModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
