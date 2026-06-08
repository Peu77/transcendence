import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { StatsService } from './stats.service'
import { AuthGuard, UserId } from '../auth/auth.guard'

@Controller('stats')
@UseGuards(AuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('me')
  async getMyStats(@UserId() userId: string) {
    return this.statsService.getView(userId)
  }

  @Get('user/:id')
  async getUserStats(@Param('id') id: string) {
    return this.statsService.getView(id)
  }
}
