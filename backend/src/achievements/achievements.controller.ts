import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AchievementsService } from './achievements.service'
import { AuthGuard, UserId } from '../auth/auth.guard'

@Controller('achievements')
@UseGuards(AuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get('me')
  async getMyAchievements(@UserId() userId: string) {
    return this.achievementsService.getForUser(userId)
  }

  @Get('user/:id')
  async getUserAchievements(@Param('id') id: string) {
    return this.achievementsService.getForUser(id)
  }
}
