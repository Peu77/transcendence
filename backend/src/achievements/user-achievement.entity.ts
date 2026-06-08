import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * Records that a user has unlocked a specific achievement.
 *
 * Only unlocked achievements are stored; locked ones are derived at read time
 * by comparing the achievement registry against the user's stats. The string
 * `achievementId` references an id in `achievement-definitions.ts`.
 */
@Entity({ name: 'user_achievements' })
@Index(['userId', 'achievementId'], { unique: true })
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  userId!: string

  @Column({ type: 'text' })
  achievementId!: string

  @CreateDateColumn()
  unlockedAt!: Date
}
