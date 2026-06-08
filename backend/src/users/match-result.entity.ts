import type { TetrisState } from '@transcendence/shared'
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from './user.entity'

@Entity({ name: 'match_results' })
@Index(['matchId', 'userId'], { unique: true })
export class MatchResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  matchId!: string

  @Column({ type: 'text' })
  roomId!: string

  @Column('uuid')
  userId!: string

  @ManyToOne(() => User, (user) => user.matchResults, {
    onDelete: 'CASCADE',
  })
  user!: User

  @Column({ type: 'int' })
  score!: number

  @Column({ type: 'int' })
  lines!: number

  @Column({ type: 'jsonb' })
  state!: TetrisState

  @CreateDateColumn()
  createdAt!: Date
}
