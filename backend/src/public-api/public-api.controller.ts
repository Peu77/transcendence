import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthGuard, UserId } from '../auth/auth.guard'
import { CreateApiKeyDto, RenameApiKeyDto } from './dto'
import { PublicApiGuard } from './public-api.guard'
import { PublicApiService } from './public-api.service'

@Controller()
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @UseGuards(AuthGuard)
  @Get('api-keys')
  async listApiKeys(@UserId() userId: string) {
    return {
      apiKeys: await this.publicApiService.listApiKeys(userId),
      endpoints: this.publicApiService.getEndpoints(),
    }
  }

  @UseGuards(AuthGuard)
  @Post('api-keys')
  async createApiKey(@UserId() userId: string, @Body() body: CreateApiKeyDto) {
    return this.publicApiService.createApiKey(userId, body.name)
  }

  @UseGuards(AuthGuard)
  @Patch('api-keys/:apiKeyId')
  async renameApiKey(
    @UserId() userId: string,
    @Param('apiKeyId') apiKeyId: string,
    @Body() body: RenameApiKeyDto,
  ) {
    return {
      apiKey: await this.publicApiService.renameApiKey(
        userId,
        apiKeyId,
        body.name,
      ),
    }
  }

  @UseGuards(AuthGuard)
  @Delete('api-keys/:apiKeyId')
  async revokeApiKey(
    @UserId() userId: string,
    @Param('apiKeyId') apiKeyId: string,
  ) {
    await this.publicApiService.revokeApiKey(userId, apiKeyId)
    return {}
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/profile')
  async getProfile(@Req() request: Request) {
    return this.publicApiService.getProfile(request.publicApiKey!.userId)
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/stats')
  async getStats(@Req() request: Request) {
    return this.publicApiService.getStats(request.publicApiKey!.userId)
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/matches')
  async getMatches(@Req() request: Request) {
    return this.publicApiService.getMatches(request.publicApiKey!.userId)
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/leaderboard')
  async getLeaderboard() {
    return this.publicApiService.getLeaderboard()
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/activity')
  async getActivity(@Req() request: Request) {
    return this.publicApiService.getActivity(request.publicApiKey!.userId)
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/friends')
  async getFriends(@Req() request: Request) {
    return this.publicApiService.getFriends(request.publicApiKey!.userId)
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/achievements')
  async getAchievements(@Req() request: Request) {
    return this.publicApiService.getAchievements(request.publicApiKey!.userId)
  }
}
