import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { createHash, randomBytes } from 'node:crypto'
import { IsNull, Repository } from 'typeorm'
import { ApiKey } from './api-key.entity'
import { AuthenticatedApiKey, PublicApiEndpoint } from './public-api.types'

type RateLimitBucket = {
  windowStartedAt: number
  count: number
}

@Injectable()
export class PublicApiService {
  private readonly buckets = new Map<string, RateLimitBucket>()
  private readonly windowMs = 60_000

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepo: Repository<ApiKey>,
  ) {}

  async createApiKey(userId: string, name: string) {
    const apiKeyName = name?.trim()
    if (!apiKeyName) throw new BadRequestException('API key name is required')

    const rawKey = `trn_${randomBytes(24).toString('hex')}`
    const apiKey = this.apiKeysRepo.create({
      userId,
      name: apiKeyName,
      keyHash: this.hashKey(rawKey),
      keyPreview: this.previewKey(rawKey),
      rateLimitPerMinute: 60,
    })

    const savedKey = await this.apiKeysRepo.save(apiKey)
    return { apiKey: this.serializeApiKey(savedKey), key: rawKey }
  }

  async listApiKeys(userId: string) {
    const apiKeys = await this.apiKeysRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    return apiKeys.map((apiKey) => this.serializeApiKey(apiKey))
  }

  async renameApiKey(userId: string, apiKeyId: string, name: string) {
    const apiKeyName = name?.trim()

    const apiKey = await this.getOwnedApiKey(userId, apiKeyId)
    apiKey.name = apiKeyName
    return this.serializeApiKey(await this.apiKeysRepo.save(apiKey))
  }

  async revokeApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.getOwnedApiKey(userId, apiKeyId)
    apiKey.revokedAt = new Date()
    await this.apiKeysRepo.save(apiKey)
  }

  async authenticate(rawKey: string): Promise<AuthenticatedApiKey> {
    const apiKey = await this.apiKeysRepo.findOne({
      where: { keyHash: this.hashKey(rawKey), revokedAt: IsNull() },
    })

    if (!apiKey) throw new UnauthorizedException('Invalid API key')

    this.consumeRateLimit(apiKey)
    apiKey.lastUsedAt = new Date()
    await this.apiKeysRepo.save(apiKey)

    return {
      id: apiKey.id,
      userId: apiKey.userId,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
    }
  }

  getEndpoints(): PublicApiEndpoint[] {
    return [
      {
        method: 'GET',
        path: '/public-api/v1/profile',
        title: 'Profile snapshot',
        description: 'Returns a static profile payload for the key owner.',
        exampleResponse: {
          id: 'mock-user',
          username: 'arcade_runner',
          level: 12,
          joinedAt: '2026-01-15T10:00:00.000Z',
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/stats',
        title: 'Lifetime statistics',
        description: 'Returns mocked lifetime gameplay statistics.',
        exampleResponse: {
          matchesPlayed: 184,
          matchesWon: 97,
          winRate: 0.527,
          totalLinesCleared: 4230,
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/matches',
        title: 'Recent matches',
        description: 'Returns a static list of recent match summaries.',
        exampleResponse: {
          matches: [
            { id: 'match_001', result: 'win', durationSeconds: 312 },
            { id: 'match_002', result: 'loss', durationSeconds: 241 },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/leaderboard',
        title: 'Leaderboard',
        description: 'Returns a mocked public leaderboard slice.',
        exampleResponse: {
          season: 'mock-season-1',
          players: [
            { rank: 1, username: 'stacksmith', score: 18240 },
            { rank: 2, username: 'lineclearer', score: 17680 },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/activity',
        title: 'Activity feed',
        description: 'Returns static gameplay activity events.',
        exampleResponse: {
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
          ],
        },
      },
    ]
  }

  private consumeRateLimit(apiKey: ApiKey) {
    const now = Date.now()
    const bucket = this.buckets.get(apiKey.id)

    if (!bucket || now - bucket.windowStartedAt >= this.windowMs) {
      this.buckets.set(apiKey.id, { windowStartedAt: now, count: 1 })
      return
    }

    if (bucket.count >= apiKey.rateLimitPerMinute) {
      throw new HttpException(
        `Rate limit exceeded. Max ${apiKey.rateLimitPerMinute} requests per minute.`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    bucket.count += 1
  }

  private async getOwnedApiKey(userId: string, apiKeyId: string) {
    const apiKey = await this.apiKeysRepo.findOne({
      where: { id: apiKeyId, userId },
    })

    if (!apiKey) throw new NotFoundException('API key not found')
    return apiKey
  }

  private hashKey(rawKey: string) {
    return createHash('sha256').update(rawKey).digest('hex')
  }

  private previewKey(rawKey: string) {
    return `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`
  }

  private serializeApiKey(apiKey: ApiKey) {
    return {
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.keyPreview,
      rateLimitPerMinute: apiKey.rateLimitPerMinute,
      lastUsedAt: apiKey.lastUsedAt,
      revokedAt: apiKey.revokedAt,
      createdAt: apiKey.createdAt,
    }
  }
}
