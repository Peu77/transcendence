import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserStats } from './user-stats.entity'
import { MatchResult } from '../users/match-result.entity'
import {
  MatchStatInput,
  SUMMABLE_METRIC_KEYS,
  UserStatsView,
} from './stats.types'

interface Aggregate {
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  totalScore: number
  highestScore: number
  totalLinesCleared: number
  totalPiecesPlaced: number
  bestCombo: number
  metrics: Record<string, number>
}

@Injectable()
export class StatsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StatsService.name)

  constructor(
    @InjectRepository(UserStats)
    private readonly statsRepo: Repository<UserStats>,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepo: Repository<MatchResult>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const backfilled = await this.backfillFromMatchResults()
      if (backfilled > 0) {
        this.logger.log(
          `Backfilled user_stats for ${backfilled} user(s) from existing match history`,
        )
      }
    } catch (error) {
      this.logger.error('Failed to backfill user_stats from match_results', error)
    }
  }

  /**
   * Seed the `user_stats` cache from historical `match_results` for users that
   * don't have a row yet. Needed when switching the ranking/stats source to
   * `user_stats`, so players with pre-existing matches keep their totals
   * instead of restarting from zero. Idempotent: users that already have a
   * stats row are left untouched, so this is safe to run on every boot.
   *
   * Note: `playTimeInSeconds` isn't recorded per match result, so it can't be
   * reconstructed and is left at 0 for backfilled rows.
   */
  async backfillFromMatchResults(): Promise<number> {
    const existing = await this.statsRepo.find({ select: { userId: true } })
    const alreadyTracked = new Set(existing.map((row) => row.userId))

    const allResults = await this.matchResultsRepo.find()
    if (allResults.length === 0) return 0

    const resultsByMatch = new Map<string, MatchResult[]>()
    for (const result of allResults) {
      const rows = resultsByMatch.get(result.matchId) ?? []
      rows.push(result)
      resultsByMatch.set(result.matchId, rows)
    }

    const aggregates = new Map<string, Aggregate>()
    for (const rows of resultsByMatch.values()) {
      const isMultiplayer = rows.length > 1
      const ranked = [...rows].sort(
        (a, b) =>
          b.score - a.score ||
          b.lines - a.lines ||
          a.userId.localeCompare(b.userId),
      )
      ranked.forEach((result, index) => {
        const agg = StatsService.getAggregate(aggregates, result.userId)
        const metrics = result.state?.metrics
        agg.matchesPlayed += 1
        if (isMultiplayer && index === 0) agg.matchesWon += 1
        if (isMultiplayer && index !== 0) agg.matchesLost += 1
        agg.totalScore += result.score
        agg.highestScore = Math.max(agg.highestScore, result.score)
        agg.totalLinesCleared += result.lines
        agg.totalPiecesPlaced += metrics?.piecesPlaced ?? 0
        agg.bestCombo = Math.max(agg.bestCombo, metrics?.maxCombo ?? 0)
        for (const key of SUMMABLE_METRIC_KEYS) {
          agg.metrics[key] = (agg.metrics[key] ?? 0) + (metrics?.[key] ?? 0)
        }
      })
    }

    const toSave: UserStats[] = []
    for (const [userId, agg] of aggregates) {
      if (alreadyTracked.has(userId)) continue
      toSave.push(
        this.statsRepo.create({
          userId,
          matchesPlayed: agg.matchesPlayed,
          matchesWon: agg.matchesWon,
          matchesLost: agg.matchesLost,
          totalScore: String(agg.totalScore),
          highestScore: agg.highestScore,
          totalLinesCleared: agg.totalLinesCleared,
          totalPiecesPlaced: agg.totalPiecesPlaced,
          bestCombo: agg.bestCombo,
          playTimeInSeconds: 0,
          metrics: agg.metrics,
        }),
      )
    }

    if (toSave.length > 0) await this.statsRepo.save(toSave)
    return toSave.length
  }

  private static getAggregate(
    aggregates: Map<string, Aggregate>,
    userId: string,
  ): Aggregate {
    let agg = aggregates.get(userId)
    if (!agg) {
      agg = {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        totalScore: 0,
        highestScore: 0,
        totalLinesCleared: 0,
        totalPiecesPlaced: 0,
        bestCombo: 0,
        metrics: {},
      }
      aggregates.set(userId, agg)
    }
    return agg
  }

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
