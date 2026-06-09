import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserStats } from './user-stats.entity'
import {
  MatchStatInput,
  SUMMABLE_METRIC_KEYS,
  UserStatsView,
} from './stats.types'

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name)

  constructor(
    @InjectRepository(UserStats)
    private readonly statsRepo: Repository<UserStats>,
  ) {}

  /** Return a user's stats row, creating an empty one if it doesn't exist. */
  async getOrCreate(userId: string): Promise<UserStats> {
    const existing = await this.statsRepo.findOne({ where: { userId } })
    if (existing) return existing
    return this.statsRepo.save(this.statsRepo.create({ userId, metrics: {} }))
  }

  /** Normalized numeric view with derived fields, for API responses. */
  async getView(userId: string): Promise<UserStatsView> {
    return StatsService.toView(await this.getOrCreate(userId))
  }

  /**
   * Apply the results of a finished match to each player's aggregate stats.
   * Only for multiplayer matches.
   */
  async recordMatch(inputs: MatchStatInput[]): Promise<void> {
    for (const input of inputs) {
      try {
        await this.applyMatch(input)
      } catch (error) {
        this.logger.error(
          `Failed to record match stats for user ${input.userId}`,
          error,
        )
      }
    }
  }

  private async applyMatch(input: MatchStatInput): Promise<void> {
    const stats = await this.getOrCreate(input.userId)

    stats.matchesPlayed += 1
    if (input.won) stats.matchesWon += 1
    if (input.lost) stats.matchesLost += 1

    stats.totalScore = String(Number(stats.totalScore) + input.score)
    stats.highestScore = Math.max(stats.highestScore, input.score)
    stats.totalLinesCleared += input.lines
    stats.totalPiecesPlaced += input.metrics.piecesPlaced
    stats.bestCombo = Math.max(stats.bestCombo, input.metrics.maxCombo)
    stats.playTimeInSeconds += Math.max(0, Math.round(input.playTimeInSeconds))

    const metrics = { ...(stats.metrics ?? {}) }
    for (const key of SUMMABLE_METRIC_KEYS) {
      metrics[key] = (metrics[key] ?? 0) + (input.metrics[key] ?? 0)
    }
    stats.metrics = metrics

    await this.statsRepo.save(stats)
  }

  static toView(stats: UserStats): UserStatsView {
    const totalScore = Number(stats.totalScore)
    const matchesPlayed = stats.matchesPlayed
    return {
      userId: stats.userId,
      matchesPlayed,
      matchesWon: stats.matchesWon,
      matchesLost: stats.matchesLost,
      totalScore,
      highestScore: stats.highestScore,
      totalLinesCleared: stats.totalLinesCleared,
      totalPiecesPlaced: stats.totalPiecesPlaced,
      bestCombo: stats.bestCombo,
      playTimeInSeconds: stats.playTimeInSeconds,
      metrics: stats.metrics ?? {},
      winRate: matchesPlayed > 0 ? stats.matchesWon / matchesPlayed : 0,
      averageScore: matchesPlayed > 0 ? Math.round(totalScore / matchesPlayed) : 0,
    }
  }
}
