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
import { In, IsNull, Repository } from 'typeorm'
import { ApiKey } from './api-key.entity'
import { AuthenticatedApiKey, PublicApiEndpoint } from './public-api.types'
import { User } from '../users/user.entity'
import { MatchResult } from '../users/match-result.entity'
import { Friendship } from '../friends/entities/friendship.entity'
import { UsersService } from '../users/users.service'
import { FriendsService } from '../friends/friends.service'

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
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepo: Repository<MatchResult>,
    @InjectRepository(Friendship)
    private readonly friendshipsRepo: Repository<Friendship>,
    private readonly usersService: UsersService,
    private readonly friendsService: FriendsService,
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

  async getProfile(userId: string) {
    const [user, friendCount] = await Promise.all([
      this.usersRepo.findOne({ where: { id: userId } }),
      this.friendshipsRepo.count({
        where: [{ userLowId: userId }, { userHighId: userId }],
      }),
    ])

    if (!user) throw new NotFoundException('User not found')

    return {
      id: user.id,
      username: user.username,
      profilePictureId: user.profilePictureId,
      level: user.level,
      friendCount,
      joinedAt: user.createdAt,
    }
  }

  async getStats(userId: string) {
    const results = await this.matchResultsRepo.find({ where: { userId } })
    const matchesWon = results.filter((result) => result.placement === 1).length
    const totalScore = results.reduce((sum, result) => sum + result.score, 0)

    return {
      matchesPlayed: results.length,
      matchesWon,
      matchesLost: results.length - matchesWon,
      winRate: results.length === 0 ? 0 : matchesWon / results.length,
      totalScore,
      highestScore: results.reduce(
        (highest, result) => Math.max(highest, result.score),
        0,
      ),
      averageScore:
        results.length === 0 ? 0 : Math.round(totalScore / results.length),
      totalLinesCleared: results.reduce((sum, result) => sum + result.lines, 0),
      totalPiecesPlaced: results.reduce(
        (sum, result) => sum + result.state.piecesPlaced,
        0,
      ),
      highestLevel: results.reduce(
        (highest, result) => Math.max(highest, result.state.level),
        0,
      ),
    }
  }

  async getMatches(userId: string) {
    const userResults = await this.matchResultsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    })

    if (userResults.length === 0) return { matches: [] }

    const allResults = await this.matchResultsRepo.find({
      where: { matchId: In(userResults.map((result) => result.matchId)) },
      relations: { user: true },
    })
    const resultsByMatch = this.groupResultsByMatch(allResults)

    return {
      matches: userResults.map((result) => {
        const matchResults = resultsByMatch.get(result.matchId) ?? []
        return {
          id: result.matchId,
          roomId: result.roomId,
          result: result.placement === 1 ? 'win' : 'loss',
          placement: result.placement,
          playerCount: matchResults.length,
          score: result.score,
          lines: result.lines,
          level: result.state.level,
          opponents: matchResults
            .filter((playerResult) => playerResult.userId !== userId)
            .map((playerResult) => ({
              userId: playerResult.userId,
              username: playerResult.user.username,
              placement: playerResult.placement,
              score: playerResult.score,
            })),
          playedAt: result.createdAt,
        }
      }),
    }
  }

  async getLeaderboard() {
    const rows = await this.matchResultsRepo
      .createQueryBuilder('result')
      .innerJoin('result.user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('user.profilePictureId', 'profilePictureId')
      .addSelect(
        'SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)',
        'wins',
      )
      .addSelect('COUNT(result.id)', 'matchesPlayed')
      .addSelect('SUM(result.score)', 'totalScore')
      .groupBy('user.id')
      .addGroupBy('user.username')
      .addGroupBy('user.profilePictureId')
      .orderBy('SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)', 'DESC')
      .addOrderBy('SUM(result.score)', 'DESC')
      .addOrderBy('user.username', 'ASC')
      .take(20)
      .getRawMany<{
        userId: string
        username: string
        profilePictureId: string | null
        wins: string
        matchesPlayed: string
        totalScore: string
      }>()

    return {
      players: rows.map((row, index) => ({
        rank: index + 1,
        userId: row.userId,
        username: row.username,
        profilePictureId: row.profilePictureId,
        wins: Number(row.wins),
        matchesPlayed: Number(row.matchesPlayed),
        totalScore: Number(row.totalScore),
      })),
    }
  }

  async getActivity(userId: string) {
    const [matches, friendships] = await Promise.all([
      this.matchResultsRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
      this.friendshipsRepo.find({
        where: [{ userLowId: userId }, { userHighId: userId }],
        relations: { userLow: true, userHigh: true },
        order: { createdAt: 'DESC' },
        take: 10,
      }),
    ])

    const matchEvents = matches.map((result) => ({
      type: result.placement === 1 ? 'match_win' : 'match_completed',
      label:
        result.placement === 1
          ? `Won a match with ${result.score} points`
          : `Finished #${result.placement ?? '-'} with ${result.score} points`,
      at: result.createdAt,
    }))
    const friendshipEvents = friendships.map((friendship) => {
      const friend =
        friendship.userLowId === userId
          ? friendship.userHigh
          : friendship.userLow
      return {
        type: 'friend_added',
        label: `Became friends with ${friend.username}`,
        at: friendship.createdAt,
      }
    })

    return {
      events: [...matchEvents, ...friendshipEvents]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 20),
    }
  }

  async getFriends(userId: string) {
    const friends = await this.friendsService.listFriends(userId)
    return { friends }
  }

  async getAchievements(userId: string) {
    return this.usersService.getUserAchievements(userId)
  }

  getEndpoints(): PublicApiEndpoint[] {
    return [
      {
        method: 'GET',
        path: '/public-api/v1/profile',
        title: 'Profile snapshot',
        description: 'Returns the current profile for the API key owner.',
        exampleResponse: {
          id: '4c37c4c2-1b1b-4b15-a522-b933cb7394aa',
          username: 'arcade_runner',
          profilePictureId: null,
          level: 8,
          friendCount: 14,
          joinedAt: '2026-01-15T10:00:00.000Z',
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/stats',
        title: 'Lifetime statistics',
        description: 'Returns lifetime statistics calculated from match data.',
        exampleResponse: {
          matchesPlayed: 42,
          matchesWon: 18,
          matchesLost: 24,
          winRate: 0.42857142857142855,
          totalScore: 284500,
          highestScore: 12400,
          averageScore: 6773,
          totalLinesCleared: 1260,
          totalPiecesPlaced: 4520,
          highestLevel: 12,
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/matches',
        title: 'Recent matches',
        description: 'Returns up to 20 recent matches for the key owner.',
        exampleResponse: {
          matches: [
            {
              id: '52a8896e-6580-47a5-975e-45e7494a14ee',
              roomId: 'game-123',
              result: 'win',
              placement: 1,
              playerCount: 2,
              score: 12400,
              lines: 38,
              level: 8,
              opponents: [
                {
                  userId: '7c9e82c1-3d2b-4f9a-8e1c-5d3b2a1f0e9d',
                  username: 'lineclearer',
                  placement: 2,
                  score: 8200,
                },
              ],
              playedAt: '2026-05-21T18:20:00.000Z',
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/leaderboard',
        title: 'Leaderboard',
        description: 'Returns the top 20 players ranked by wins and score.',
        exampleResponse: {
          players: [
            {
              rank: 1,
              userId: '4c37c4c2-1b1b-4b15-a522-b933cb7394aa',
              username: 'stacksmith',
              profilePictureId: 'abc-123',
              wins: 31,
              matchesPlayed: 54,
              totalScore: 492100,
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/activity',
        title: 'Activity feed',
        description: 'Returns recent match and friendship activity.',
        exampleResponse: {
          events: [
            {
              type: 'match_win',
              label: 'Won a match with 12400 points',
              at: '2026-05-21T18:20:00.000Z',
            },
            {
              type: 'friend_added',
              label: 'Became friends with arcade_master',
              at: '2026-05-20T19:05:00.000Z',
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/friends',
        title: 'Friends list',
        description: 'Returns the current friends list and their status.',
        exampleResponse: {
          friends: [
            {
              id: '7c9e82c1-3d2b-4f9a-8e1c-5d3b2a1f0e9d',
              username: 'block_master',
              profilePictureId: 'pfp-456',
              level: 15,
              status: 'online',
              lastSeenAt: '2026-06-12T20:00:00.000Z',
              since: '2026-02-10T14:30:00.000Z',
            },
          ],
        },
      },
      {
        method: 'GET',
        path: '/public-api/v1/achievements',
        title: 'Achievements',
        description: 'Returns unlocked and locked achievements with progress.',
        exampleResponse: {
          stats: {
            matches: 42,
            score: 284500,
            lines: 1260,
            wins: 18,
            friends: 14,
            rank: 5,
            level: 8,
          },
          achievements: [
            {
              id: 'first_match',
              label: 'First Match',
              description: 'Play your first match',
              unlocked: true,
            },
          ],
        },
      },
    ]
  }

  private groupResultsByMatch(results: MatchResult[]) {
    const grouped = new Map<string, MatchResult[]>()
    for (const result of results) {
      const matchResults = grouped.get(result.matchId) ?? []
      matchResults.push(result)
      grouped.set(result.matchId, matchResults)
    }
    return grouped
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
