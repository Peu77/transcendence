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
    return {
      id: request.publicApiKey?.userId ?? 'mock-user',
      username: 'arcade_runner',
      level: 12,
      joinedAt: '2026-01-15T10:00:00.000Z',
    }
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/stats')
  async getStats() {
    return {
      matchesPlayed: 184,
      matchesWon: 97,
      matchesLost: 87,
      winRate: 0.527,
      totalLinesCleared: 4230,
      piecesPlaced: 38122,
    }
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/matches')
  async getMatches() {
    return {
      matches: [
        {
          id: 'match_001',
          result: 'win',
          opponent: 'stacksmith',
          durationSeconds: 312,
          playedAt: '2026-05-31T20:42:00.000Z',
        },
        {
          id: 'match_002',
          result: 'loss',
          opponent: 'lineclearer',
          durationSeconds: 241,
          playedAt: '2026-05-30T17:15:00.000Z',
        },
      ],
    }
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/leaderboard')
  async getLeaderboard() {
    return {
      season: 'mock-season-1',
      players: [
        { rank: 1, username: 'stacksmith', score: 18240 },
        { rank: 2, username: 'lineclearer', score: 17680 },
        { rank: 3, username: 'arcade_runner', score: 16990 },
      ],
    }
  }

  @UseGuards(PublicApiGuard)
  @Get('public-api/v1/activity')
  async getActivity() {
    return {
      events: [
        {
          type: 'level_up',
          label: 'Reached level 12',
          at: '2026-05-21T18:20:00.000Z',
        },
        {
          type: 'match_win',
          label: 'Won a ranked match',
          at: '2026-05-20T19:05:00.000Z',
        },
        {
          type: 'friend_added',
          label: 'Connected with stacksmith',
          at: '2026-05-19T12:10:00.000Z',
        },
      ],
    }
  }
}
