import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserAchievement } from './user-achievement.entity'
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  AchievementDefinition,
} from './achievement-definitions'
import { StatsService } from '../stats/stats.service'
import type { UserStatsView } from '../stats/stats.types'

export interface AchievementProgress {
  id: string
  name: string
  description: string
  category: string
  icon: string
  goal: number
  unit: 'count' | 'minutes'
  progress: number
  unlocked: boolean
  unlockedAt: Date | null
}

export interface UnlockedAchievement {
  id: string
  name: string
  description: string
  icon: string
}

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name)

  constructor(
    @InjectRepository(UserAchievement)
    private readonly userAchievementsRepo: Repository<UserAchievement>,
    private readonly statsService: StatsService,
  ) {}

  /**
   * Re-evaluate all achievements for a user and persist any that became
   * unlocked. Returns the achievements newly unlocked by this call (useful for
   * notifying the player in real time).
   */
  async evaluate(userId: string): Promise<UnlockedAchievement[]> {
    const stats = await this.statsService.getView(userId)
    const alreadyUnlocked = await this.getUnlockedIds(userId)

    const newlyUnlocked: AchievementDefinition[] = ACHIEVEMENTS.filter(
      (achievement) =>
        !alreadyUnlocked.has(achievement.id) &&
        achievement.progress(stats) >= achievement.goal,
    )

    if (newlyUnlocked.length === 0) return []

    try {
      await this.userAchievementsRepo
        .createQueryBuilder()
        .insert()
        .into(UserAchievement)
        .values(
          newlyUnlocked.map((achievement) => ({
            userId,
            achievementId: achievement.id,
          })),
        )
        .orIgnore()
        .execute()
    } catch (error) {
      this.logger.error(
        `Failed to persist achievements for user ${userId}`,
        error,
      )
      return []
    }

    return newlyUnlocked.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
    }))
  }

  /** All achievements with unlock status and progress for a user. */
  async getForUser(userId: string): Promise<AchievementProgress[]> {
    const stats = await this.statsService.getView(userId)
    const unlockedAt = await this.getUnlockedMap(userId)

    return ACHIEVEMENTS.map((achievement) =>
      this.toProgress(achievement, stats, unlockedAt.get(achievement.id)),
    )
  }

  private toProgress(
    achievement: AchievementDefinition,
    stats: UserStatsView,
    unlockedAt: Date | undefined,
  ): AchievementProgress {
    const rawProgress = achievement.progress(stats)
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      icon: achievement.icon,
      goal: achievement.goal,
      unit: achievement.unit ?? 'count',
      progress: Math.min(rawProgress, achievement.goal),
      unlocked: unlockedAt !== undefined || rawProgress >= achievement.goal,
      unlockedAt: unlockedAt ?? null,
    }
  }

  private async getUnlockedIds(userId: string): Promise<Set<string>> {
    const rows = await this.userAchievementsRepo.find({ where: { userId } })
    return new Set(
      rows
        .filter((row) => ACHIEVEMENTS_BY_ID.has(row.achievementId))
        .map((row) => row.achievementId),
    )
  }

  private async getUnlockedMap(userId: string): Promise<Map<string, Date>> {
    const rows = await this.userAchievementsRepo.find({ where: { userId } })
    return new Map(rows.map((row) => [row.achievementId, row.unlockedAt]))
  }
}
