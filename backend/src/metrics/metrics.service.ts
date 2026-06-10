import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Counter, Gauge, Registry, collectDefaultMetrics } from 'prom-client'
import { Repository } from 'typeorm'
import {
  PresenceStatus,
  UserPresence,
} from '../friends/entities/user-presence.entity'
import { MatchResult } from '../users/match-result.entity'
import { User } from '../users/user.entity'

interface MatchMetrics {
  games: string
  playerResults: string
  totalScore: string
  totalLines: string
  averageScore: string
  averageLines: string
  highScore: string
}

interface PresenceMetrics {
  status: PresenceStatus
  count: string
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name)
  private refreshPromise: Promise<void> | null = null

  readonly registry: Registry
  readonly httpRequestsTotal: Counter
  readonly usersTotal: Gauge
  readonly usersByPresence: Gauge
  readonly gamesTotal: Gauge
  readonly gamePlayerResultsTotal: Gauge
  readonly gameScoreTotal: Gauge
  readonly gameLinesClearedTotal: Gauge
  readonly gameScoreAverage: Gauge
  readonly gameLinesClearedAverage: Gauge
  readonly gameHighScore: Gauge
  readonly gamePlayersAverage: Gauge

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserPresence)
    private readonly presenceRepository: Repository<UserPresence>,
    @InjectRepository(MatchResult)
    private readonly matchResultsRepository: Repository<MatchResult>,
  ) {
    this.registry = new Registry()
    collectDefaultMetrics({ register: this.registry })

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    })

    this.usersTotal = this.createGauge(
      'transcendence_users_total',
      'Total number of registered users',
    )
    this.usersByPresence = this.createGauge(
      'transcendence_users_by_presence',
      'Number of users by presence status',
      ['status'],
    )
    this.gamesTotal = this.createGauge(
      'transcendence_games_total',
      'Total number of completed games',
    )
    this.gamePlayerResultsTotal = this.createGauge(
      'transcendence_game_player_results_total',
      'Total number of player results across completed games',
    )
    this.gameScoreTotal = this.createGauge(
      'transcendence_game_score_total',
      'Total score accumulated across completed games',
    )
    this.gameLinesClearedTotal = this.createGauge(
      'transcendence_game_lines_cleared_total',
      'Total lines cleared across completed games',
    )
    this.gameScoreAverage = this.createGauge(
      'transcendence_game_score_average',
      'Average player score per completed game result',
    )
    this.gameLinesClearedAverage = this.createGauge(
      'transcendence_game_lines_cleared_average',
      'Average lines cleared per completed game result',
    )
    this.gameHighScore = this.createGauge(
      'transcendence_game_high_score',
      'Highest score recorded for a player in a completed game',
    )
    this.gamePlayersAverage = this.createGauge(
      'transcendence_game_players_average',
      'Average number of players per completed game',
    )
  }

  async getMetrics(): Promise<string> {
    await this.refreshDatabaseMetrics()
    return this.registry.metrics()
  }

  getContentType(): string {
    return this.registry.contentType
  }

  private createGauge(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): Gauge {
    return new Gauge({
      name,
      help,
      labelNames,
      registers: [this.registry],
    })
  }

  private async refreshDatabaseMetrics(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.loadDatabaseMetrics()
        .catch((error: unknown) => {
          this.logger.warn('Failed to refresh database metrics', error)
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }

    await this.refreshPromise
  }

  private async loadDatabaseMetrics(): Promise<void> {
    const [userCount, presenceCounts, matchMetrics] = await Promise.all([
      this.usersRepository.count(),
      this.presenceRepository
        .createQueryBuilder('presence')
        .select('presence.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('presence.status')
        .getRawMany<PresenceMetrics>(),
      this.matchResultsRepository
        .createQueryBuilder('result')
        .select('COUNT(DISTINCT result.matchId)', 'games')
        .addSelect('COUNT(result.id)', 'playerResults')
        .addSelect('COALESCE(SUM(result.score), 0)', 'totalScore')
        .addSelect('COALESCE(SUM(result.lines), 0)', 'totalLines')
        .addSelect('COALESCE(AVG(result.score), 0)', 'averageScore')
        .addSelect('COALESCE(AVG(result.lines), 0)', 'averageLines')
        .addSelect('COALESCE(MAX(result.score), 0)', 'highScore')
        .getRawOne<MatchMetrics>(),
    ])

    const stats = matchMetrics ?? {
      games: '0',
      playerResults: '0',
      totalScore: '0',
      totalLines: '0',
      averageScore: '0',
      averageLines: '0',
      highScore: '0',
    }
    const games = Number(stats.games)
    const playerResults = Number(stats.playerResults)

    this.usersTotal.set(userCount)
    for (const status of Object.values(PresenceStatus)) {
      this.usersByPresence.set({ status }, 0)
    }
    for (const presence of presenceCounts) {
      this.usersByPresence.set(
        { status: presence.status },
        Number(presence.count),
      )
    }

    this.gamesTotal.set(games)
    this.gamePlayerResultsTotal.set(playerResults)
    this.gameScoreTotal.set(Number(stats.totalScore))
    this.gameLinesClearedTotal.set(Number(stats.totalLines))
    this.gameScoreAverage.set(Number(stats.averageScore))
    this.gameLinesClearedAverage.set(Number(stats.averageLines))
    this.gameHighScore.set(Number(stats.highScore))
    this.gamePlayersAverage.set(games === 0 ? 0 : playerResults / games)
  }
}
