import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository, SelectQueryBuilder } from 'typeorm'
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
import { Friendship } from '../friends/entities/friendship.entity'
import { UserBlock } from '../friends/entities/block.entity'

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

interface PlayerStats {
  matchCount: number
  totalLines: number
  totalScore: number | null
  wins: number
}

export interface AchievementStats {
  matches: number
  score: number
  lines: number
  wins: number
  friends: number
  rank: number
  level: number
  bestDomination: number
  baseUnlocked?: number
  totalBaseAchievements?: number
}

export interface Achievement {
  id: string
  label: string
  description: string
  unlocked: boolean
}

interface HeadToHeadStats {
  sharedMatchCount: number
  sharedPoints: number
  requesterTotalPoints: number
  winsAgainstThem: number
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepo: Repository<MatchResult>,
    @InjectRepository(UserBlock)
    private readonly userBlocksRepo: Repository<UserBlock>,
    @InjectRepository(Friendship)
    private readonly friendshipsRepo: Repository<Friendship>,
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
    const values = Object.values(gameControls)
    if (new Set(values).size !== values.length) {
      throw new BadRequestException('Each keybind must be unique')
    }
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
    const [user, playerStats, blockedByThem, iBlockedThem] = await Promise.all([
      this.usersRepo.findOneOrFail({ where: { id: userId } }),
      this.getPlayerStats(userId),
      this.isBlockedByUser(userId, requesterId),
      this.isBlockedByUser(requesterId, userId),
    ])
    const [rank, headToHeadStats] = await Promise.all([
      this.getPlayerRank(playerStats),
      this.getHeadToHeadStats(userId, requesterId),
    ])

    return {
      id: user.id,
      username: user.username,
      profilePictureId: user.profilePictureId,
      createdAt: user.createdAt,
      totalScore: playerStats.totalScore,
      totalLines: playerStats.totalLines,
      rank,
      blockedByThem,
      iBlockedThem,
      ...headToHeadStats,
    }
  }

  private async getPlayerStats(userId: string): Promise<PlayerStats> {
    const result = await this.matchResultsRepo
      .createQueryBuilder('result')
      .select('SUM(result.score)', 'totalScore')
      .addSelect('SUM(result.lines)', 'totalLines')
      .addSelect('COUNT(result.id)', 'matchCount')
      .addSelect(
        'SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)',
        'wins',
      )
      .where('result.userId = :userId', { userId })
      .getRawOne<{
        totalScore: string | null
        totalLines: string | null
        matchCount: string
        wins: string
      }>()

    const matchCount = Number(result?.matchCount ?? 0)

    return {
      matchCount,
      totalLines: Number(result?.totalLines ?? 0),
      totalScore: matchCount > 0 ? Number(result?.totalScore ?? 0) : null,
      wins: Number(result?.wins ?? 0),
    }
  }

  private async getPlayerRank({
    matchCount,
    wins,
  }: PlayerStats): Promise<number | null> {
    if (matchCount === 0) return null

    const higherRankedPlayers = await this.matchResultsRepo
      .createQueryBuilder('result')
      .select('result.userId')
      .groupBy('result.userId')
      .having('SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END) > :wins', {
        wins,
      })
      .getRawMany()

    return higherRankedPlayers.length + 1
  }

  private async isBlockedByUser(
    userId: string,
    requesterId: string,
  ): Promise<boolean> {
    if (userId === requesterId) return false

    return this.userBlocksRepo.exists({
      where: { blockerId: userId, blockedId: requesterId },
    })
  }

  private async getHeadToHeadStats(
    userId: string,
    requesterId: string,
  ): Promise<HeadToHeadStats> {
    if (userId === requesterId) return this.emptyHeadToHeadStats()

    const [
      sharedMatchCount,
      sharedPointsResult,
      requesterPointsResult,
      winsAgainstThem,
    ] = await Promise.all([
      this.createSharedMatchesQuery(userId, requesterId).getCount(),
      this.createSharedMatchesQuery(userId, requesterId)
        .select('SUM(r1.score)', 'total')
        .getRawOne<{ total: string | null }>(),
      this.getTotalPoints(requesterId),
      this.createSharedMatchesQuery(userId, requesterId)
        .andWhere('r1.placement = 1')
        .getCount(),
    ])

    return {
      sharedMatchCount,
      sharedPoints: Number(sharedPointsResult?.total ?? 0),
      requesterTotalPoints: Number(requesterPointsResult?.total ?? 0),
      winsAgainstThem,
    }
  }

  private createSharedMatchesQuery(
    userId: string,
    requesterId: string,
  ): SelectQueryBuilder<MatchResult> {
    return this.matchResultsRepo
      .createQueryBuilder('r1')
      .innerJoin(
        MatchResult,
        'r2',
        'r1.matchId = r2.matchId AND r2.userId = :userId',
        { userId },
      )
      .where('r1.userId = :requesterId', { requesterId })
  }

  private getTotalPoints(userId: string) {
    return this.matchResultsRepo
      .createQueryBuilder('result')
      .select('SUM(result.score)', 'total')
      .where('result.userId = :userId', { userId })
      .getRawOne<{ total: string | null }>()
  }

  private emptyHeadToHeadStats(): HeadToHeadStats {
    return {
      sharedMatchCount: 0,
      sharedPoints: 0,
      requesterTotalPoints: 0,
      winsAgainstThem: 0,
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
          profilePictureId: result.user.profilePictureId,
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

  async getUserAchievements(userId: string) {
    const stats = await this.getAchievementStats(userId)
    const baseAchievements = this.getBaseAchievements(stats)
    const baseUnlocked = baseAchievements.filter((a) => a.unlocked).length
    const metaAchievements = this.getMetaAchievements(
      baseUnlocked,
      baseAchievements.length,
    )

    return {
      stats: {
        ...stats,
        baseUnlocked,
        totalBaseAchievements: baseAchievements.length,
      },
      achievements: [...baseAchievements, ...metaAchievements],
    }
  }

  private async getAchievementStats(userId: string): Promise<AchievementStats> {
    const [matchCount, totals, winCount, friendCount, higherRankedUsersCount] =
      await Promise.all([
        this.matchResultsRepo.count({ where: { userId } }),
        this.matchResultsRepo
          .createQueryBuilder('r')
          .select('SUM(r.score)', 'score')
          .addSelect('SUM(r.lines)', 'lines')
          .where('r.userId = :userId', { userId })
          .getRawOne<{ score: string | null; lines: string | null }>(),
        this.matchResultsRepo.count({
          where: { userId, placement: 1 },
        }),
        this.friendshipsRepo
          .createQueryBuilder('f')
          .where('f.userLowId = :userId OR f.userHighId = :userId', { userId })
          .getCount(),
        this.getHigherRankedUsersCountByScore(userId),
      ])

    const matches = matchCount
    const score = Number(totals?.score ?? 0)
    const lines = Number(totals?.lines ?? 0)
    const wins = winCount
    const friends = friendCount
    const rank = matches > 0 ? higherRankedUsersCount + 1 : 0
    const level = Math.floor(lines / 10) + 1
    const bestDomination = await this.calculateBestDomination(userId, matches)

    return {
      matches,
      score,
      lines,
      wins,
      friends,
      rank,
      level,
      bestDomination,
    }
  }

  private async getHigherRankedUsersCountByScore(
    userId: string,
  ): Promise<number> {
    const myScoreSub = this.matchResultsRepo
      .createQueryBuilder('r2')
      .select('COALESCE(SUM(r2.score), 0)', 'myScore')
      .where('r2.userId = :userId', { userId })

    const higherRankedUsers = await this.matchResultsRepo
      .createQueryBuilder('r')
      .select('r.userId', 'userId')
      .groupBy('r.userId')
      .having(`SUM(r.score) > (${myScoreSub.getQuery()})`)
      .setParameters(myScoreSub.getParameters())
      .getRawMany<{ userId: string }>()

    return higherRankedUsers.length
  }

  private async calculateBestDomination(
    userId: string,
    matches: number,
  ): Promise<number> {
    if (matches === 0) return 0

    const userResults = await this.matchResultsRepo.find({
      where: { userId },
      select: ['matchId', 'placement'],
    })

    const matchIds = [...new Set(userResults.map((r) => r.matchId))]
    const allResults = await this.matchResultsRepo.find({
      where: { matchId: In(matchIds) },
      select: ['matchId', 'userId'],
    })

    const userWonMatches = new Set(
      userResults.filter((r) => r.placement === 1).map((r) => r.matchId),
    )

    const opponentStats = new Map<string, { total: number; wins: number }>()
    for (const r of allResults) {
      if (r.userId === userId) continue
      const s = opponentStats.get(r.userId) ?? { total: 0, wins: 0 }
      s.total++
      if (userWonMatches.has(r.matchId)) s.wins++
      opponentStats.set(r.userId, s)
    }

    const dominations = Array.from(opponentStats.values())
      .filter((s) => s.wins === s.total)
      .map((s) => s.total)

    return dominations.length > 0 ? Math.max(...dominations) : 0
  }

  private getBaseAchievements(stats: AchievementStats): Achievement[] {
    const {
      matches,
      score,
      lines,
      wins,
      friends,
      level,
      rank,
      bestDomination,
    } = stats
    return [
      {
        id: 'first_match',
        label: 'First Match',
        description: 'Play your first match',
        unlocked: matches >= 1,
      },
      {
        id: 'matches_10',
        label: 'Getting Started',
        description: 'Play 10 matches',
        unlocked: matches >= 10,
      },
      {
        id: 'matches_50',
        label: 'Dedicated Player',
        description: 'Play 50 matches',
        unlocked: matches >= 50,
      },
      {
        id: 'matches_100',
        label: 'Centurion',
        description: 'Play 100 matches',
        unlocked: matches >= 100,
      },
      {
        id: 'score_1k',
        label: 'Point Collector',
        description: 'Score 1,000 total points',
        unlocked: score >= 1000,
      },
      {
        id: 'score_10k',
        label: 'High Scorer',
        description: 'Score 10,000 total points',
        unlocked: score >= 10000,
      },
      {
        id: 'score_100k',
        label: 'Legend',
        description: 'Score 100,000 total points',
        unlocked: score >= 100000,
      },
      {
        id: 'lines_100',
        label: 'Line Clearer',
        description: 'Clear 100 total lines',
        unlocked: lines >= 100,
      },
      {
        id: 'lines_500',
        label: 'Wrecking Ball',
        description: 'Clear 500 total lines',
        unlocked: lines >= 500,
      },
      {
        id: 'lines_1000',
        label: 'Line Destroyer',
        description: 'Clear 1,000 total lines',
        unlocked: lines >= 1000,
      },
      {
        id: 'first_win',
        label: 'Winner',
        description: 'Win your first match',
        unlocked: wins >= 1,
      },
      {
        id: 'wins_10',
        label: 'Seasoned Victor',
        description: 'Win 10 matches',
        unlocked: wins >= 10,
      },
      {
        id: 'wins_50',
        label: 'Champion',
        description: 'Win 50 matches',
        unlocked: wins >= 50,
      },
      {
        id: 'first_friend',
        label: 'Social Butterfly',
        description: 'Make your first friend',
        unlocked: friends >= 1,
      },
      {
        id: 'friends_5',
        label: 'Popular',
        description: 'Have 5 friends',
        unlocked: friends >= 5,
      },
      {
        id: 'level_5',
        label: 'Getting Warmed Up',
        description: 'Reach level 5',
        unlocked: level >= 5,
      },
      {
        id: 'level_10',
        label: 'Seasoned',
        description: 'Reach level 10',
        unlocked: level >= 10,
      },
      {
        id: 'level_25',
        label: 'Veteran',
        description: 'Reach level 25',
        unlocked: level >= 25,
      },
      {
        id: 'level_50',
        label: 'Elite',
        description: 'Reach level 50',
        unlocked: level >= 50,
      },
      {
        id: 'rank_top10',
        label: 'Rising Star',
        description: 'Reach top 10 on the leaderboard',
        unlocked: rank > 0 && rank <= 10,
      },
      {
        id: 'rank_top3',
        label: 'Podium Finish',
        description: 'Reach top 3 on the leaderboard',
        unlocked: rank > 0 && rank <= 3,
      },
      {
        id: 'rank_1',
        label: 'King of the Board',
        description: 'Reach #1 on the leaderboard',
        unlocked: rank === 1,
      },
      {
        id: 'domination_3',
        label: 'Bully',
        description:
          'Beat the same opponent in 3 matches without ever losing to them',
        unlocked: bestDomination >= 3,
      },
      {
        id: 'domination_5',
        label: 'Dominator',
        description:
          'Beat the same opponent in 5 matches without ever losing to them',
        unlocked: bestDomination >= 5,
      },
      {
        id: 'domination_10',
        label: 'Their Nightmare',
        description:
          'Beat the same opponent in 10 matches without ever losing to them',
        unlocked: bestDomination >= 10,
      },
    ]
  }

  private getMetaAchievements(
    baseUnlocked: number,
    totalBase: number,
  ): Achievement[] {
    return [
      {
        id: 'collector_1',
        label: 'First Step',
        description: 'Unlock your first achievement',
        unlocked: baseUnlocked >= 1,
      },
      {
        id: 'collector_5',
        label: 'Collector',
        description: 'Unlock 5 achievements',
        unlocked: baseUnlocked >= 5,
      },
      {
        id: 'collector_all',
        label: 'Completionist',
        description: 'Unlock all achievements',
        unlocked: baseUnlocked >= totalBase,
      },
    ]
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
