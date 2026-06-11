import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import {
  DEFAULT_GAME_CONTROLS,
  DEFAULT_TETRIS_HANDLING_SETTINGS,
  GameControlAction,
  GameControls,
  TetrisHandlingSettings,
  Theme,
  User,
  UserType,
} from './user.entity'
import { UserInfo } from '../realtime/realtime.events'
import { GithubValidateReturn } from '../auth/github.strategy'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { MatchResult } from './match-result.entity'
import { UserBlock } from '../friends/entities/user-block.entity'

export interface MatchHistoryPlayer {
  userId: string
  username: string
  score: number
  lines: number
  level: number
  placement: number
}

export interface MatchHistoryItem {
  matchId: string
  roomId: string
  playedAt: Date
  placement: number
  playerCount: number
  score: number
  lines: number
  level: number
  players: MatchHistoryPlayer[]
}

export interface GlobalRankingItem {
  userId: string
  username: string
  profilePictureId: string | null
  wins: number
  matchesPlayed: number
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepo: Repository<MatchResult>,
    @InjectRepository(UserBlock)
    private readonly userBlocksRepo: Repository<UserBlock>,
  ) {}

  static readonly UPLOAD_DIR = 'uploads/'

  normalizeUsername(username: string): string {
    return username.toLowerCase()
  }

  async createUser(
    userType: UserType,
    email: string,
    username: string,
    passwordHash: string | null,
    githubId: string | null,
    githubAvatarUrl: string | null,
  ): Promise<User> {
    const user = this.usersRepo.create({
      userType,
      email: email.toLowerCase(),
      username: this.normalizeUsername(username),
      password: passwordHash,
      githubId,
      githubAvatarUrl,
    })
    return await this.usersRepo.save(user)
  }

  async existsByEmail(email: string): Promise<boolean> {
    return await this.usersRepo.existsBy({ email: email.toLowerCase() })
  }

  async existsByUsername(username: string): Promise<boolean> {
    return await this.usersRepo.existsBy({
      username: this.normalizeUsername(username),
    })
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } })
  }

  async findByGithubId(githubId: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { githubId, userType: UserType.GITHUB },
    })
  }

  async upsertGithubUser(profile: GithubValidateReturn): Promise<User> {
    const byGithub = await this.findByGithubId(profile.githubId)
    if (byGithub) return byGithub

    return this.createUser(
      UserType.GITHUB,
      profile.email,
      profile.username,
      null,
      profile.githubId,
      profile.avatarUrl,
    )
  }

  async getUserByid(id: string): Promise<User> {
    return await this.usersRepo.findOneOrFail({ where: { id } })
  }

  async updateProfilePictureId(
    userId: string,
    profilePictureId: string | null,
  ): Promise<void> {
    await this.usersRepo.update({ id: userId }, { profilePictureId })
  }

  async updateTwoFaSecret(
    userId: string,
    twoFaSecret: string | null,
  ): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaSecret })
  }

  async enableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update({ id: userId }, { twoFaEnabled: true })
  }

  async disableTwoFa(userId: string): Promise<void> {
    await this.usersRepo.update(
      { id: userId },
      { twoFaEnabled: false, twoFaSecret: null },
    )
  }

  async toggleTheme(userId: string): Promise<Theme> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })
    const newTheme = user.theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT
    await this.usersRepo.update({ id: userId }, { theme: newTheme })
    return newTheme
  }

  async updateGameControls(
    userId: string,
    controls: Partial<GameControls>,
  ): Promise<GameControls> {
    const gameControls = this.normalizeGameControls(controls)
    await this.usersRepo.update({ id: userId }, { gameControls })
    return gameControls
  }

  async updateTetrisHandlingSettings(
    userId: string,
    settings: Partial<TetrisHandlingSettings>,
  ): Promise<TetrisHandlingSettings> {
    const tetrisHandlingSettings =
      this.normalizeTetrisHandlingSettings(settings)
    await this.usersRepo.update({ id: userId }, { tetrisHandlingSettings })
    return tetrisHandlingSettings
  }

  normalizeGameControls(controls: Partial<GameControls> | null): GameControls {
    const normalized = { ...DEFAULT_GAME_CONTROLS }

    for (const action of Object.values(GameControlAction)) {
      const key = controls?.[action]
      if (typeof key === 'string' && key.length > 0) {
        normalized[action] = key
      }
    }

    return normalized
  }

  normalizeTetrisHandlingSettings(
    settings: Partial<TetrisHandlingSettings> | null,
  ): TetrisHandlingSettings {
    const normalized = { ...DEFAULT_TETRIS_HANDLING_SETTINGS }
    const limits: Record<keyof TetrisHandlingSettings, [number, number]> = {
      arr: [0, 1000],
      das: [0, 1000],
      dcd: [0, 1000],
      sdf: [0, 1000],
    }

    for (const key of Object.keys(limits) as (keyof TetrisHandlingSettings)[]) {
      const value = settings?.[key]
      if (typeof value === 'number' && Number.isFinite(value)) {
        const [min, max] = limits[key]
        normalized[key] = Math.min(Math.max(Math.round(value), min), max)
      }
    }

    return normalized
  }

  async getPublicProfile(userId: string, requesterId: string) {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })

    const statsResult = await this.matchResultsRepo
      .createQueryBuilder('result')
      .select('SUM(result.score)', 'totalScore')
      .addSelect('SUM(result.lines)', 'totalLines')
      .addSelect('COUNT(result.id)', 'matchCount')
      .addSelect('SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)', 'wins')
      .where('result.userId = :userId', { userId })
      .getRawOne<{
        totalScore: string | null
        totalLines: string | null
        matchCount: string
        wins: string
      }>()

    const matchCount = Number(statsResult?.matchCount ?? 0)
    const totalLines = Number(statsResult?.totalLines ?? 0)
    const totalScore =
      matchCount > 0 ? Number(statsResult?.totalScore ?? 0) : null
    const wins = Number(statsResult?.wins ?? 0)

    let rank: number | null = null
    if (matchCount > 0) {
      const higherRanked = await this.matchResultsRepo
        .createQueryBuilder('result')
        .select('result.userId')
        .groupBy('result.userId')
        .having(
          'SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END) > :wins',
          { wins },
        )
        .getRawMany()

      rank = higherRanked.length + 1
    }

    const blockedByThem = userId !== requesterId
      ? await this.userBlocksRepo.exists({ where: { blockerId: userId, blockedId: requesterId } })
      : false

    let sharedMatchCount = 0
    let sharedPoints = 0
    let requesterTotalPoints = 0
    let winsAgainstThem = 0
    if (userId !== requesterId) {
      const [sharedCountResult, sharedPtsResult, requesterStatsResult, winsResult] =
        await Promise.all([
          this.matchResultsRepo
            .createQueryBuilder('r1')
            .innerJoin(
              MatchResult,
              'r2',
              'r1.matchId = r2.matchId AND r2.userId = :userId',
              { userId },
            )
            .where('r1.userId = :requesterId', { requesterId })
            .getCount(),
          this.matchResultsRepo
            .createQueryBuilder('r1')
            .innerJoin(
              MatchResult,
              'r2',
              'r1.matchId = r2.matchId AND r2.userId = :userId',
              { userId },
            )
            .select('SUM(r1.score)', 'total')
            .where('r1.userId = :requesterId', { requesterId })
            .getRawOne<{ total: string | null }>(),
          this.matchResultsRepo
            .createQueryBuilder('result')
            .select('SUM(result.score)', 'total')
            .where('result.userId = :requesterId', { requesterId })
            .getRawOne<{ total: string | null }>(),
          this.matchResultsRepo
            .createQueryBuilder('r1')
            .innerJoin(
              MatchResult,
              'r2',
              'r1.matchId = r2.matchId AND r2.userId = :userId',
              { userId },
            )
            .where('r1.userId = :requesterId', { requesterId })
            .andWhere('r1.placement = 1')
            .getCount(),
        ])

      sharedMatchCount = sharedCountResult
      sharedPoints = Number(sharedPtsResult?.total ?? 0)
      requesterTotalPoints = Number(requesterStatsResult?.total ?? 0)
      winsAgainstThem = winsResult
    }

    return {
      id: user.id,
      username: user.username,
      profilePictureId: user.profilePictureId,
      createdAt: user.createdAt,
      totalScore,
      totalLines,
      rank,
      blockedByThem,
      sharedMatchCount,
      sharedPoints,
      requesterTotalPoints,
      winsAgainstThem,
    }
  }

  async getUserInfo(userId: string): Promise<UserInfo> {
    const user = await this.usersRepo.findOneOrFail({ where: { id: userId } })
    return {
      username: user.username,
      profilePictureId: user.profilePictureId,
    }
  }

  async getMatchHistory(userId: string): Promise<MatchHistoryItem[]> {
    const userResults = await this.matchResultsRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    })

    if (userResults.length === 0) return []

    const allResults = await this.matchResultsRepo.find({
      where: { matchId: In(userResults.map((result) => result.matchId)) },
      relations: { user: true },
    })

    const resultsByMatch = new Map<string, MatchResult[]>()
    for (const result of allResults) {
      const matchResults = resultsByMatch.get(result.matchId) ?? []
      matchResults.push(result)
      resultsByMatch.set(result.matchId, matchResults)
    }

    return userResults.map((userResult) => {
      const players = (resultsByMatch.get(userResult.matchId) ?? [])
        .sort((a, b) => {
          const pa = a.placement ?? Infinity
          const pb = b.placement ?? Infinity
          if (pa !== pb) return pa - pb
          return b.score - a.score || b.lines - a.lines
        })
        .map((result, index) => ({
          userId: result.userId,
          username: result.user.username,
          profilePictureId: result.user.profilePictureId ?? null,
          score: result.score,
          lines: result.lines,
          level: result.state.level,
          placement: result.placement ?? index + 1,
        }))

      return {
        matchId: userResult.matchId,
        roomId: userResult.roomId,
        playedAt: userResult.createdAt,
        placement:
          userResult.placement ??
          players.find((player) => player.userId === userId)?.placement ??
          1,
        playerCount: players.length,
        score: userResult.score,
        lines: userResult.lines,
        level: userResult.state.level,
        players,
      }
    })
  }

  async getGlobalRanking(): Promise<GlobalRankingItem[]> {
    const rankings = await this.matchResultsRepo
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
      .groupBy('user.id')
      .addGroupBy('user.username')
      .addGroupBy('user.profilePictureId')
      .orderBy('SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)', 'DESC')
      .addOrderBy('COUNT(result.id)', 'DESC')
      .addOrderBy('user.username', 'ASC')
      .getRawMany<{
        userId: string
        username: string
        profilePictureId: string | null
        wins: string
        matchesPlayed: string
      }>()

    return rankings.map((ranking) => ({
      ...ranking,
      wins: Number(ranking.wins),
      matchesPlayed: Number(ranking.matchesPlayed),
    }))
  }

  async existUserProfilePictureInFs(
    profilePictureId: string,
  ): Promise<boolean> {
    try {
      console.log('Checking if profile picture exists:', profilePictureId)
      console.log('Upload directory:', UsersService.UPLOAD_DIR)
      await fs.access(path.join(UsersService.UPLOAD_DIR, profilePictureId))
      return true
    } catch (e) {
      console.log('Profile picture does not exist:', e)
      return false
    }
  }
}
