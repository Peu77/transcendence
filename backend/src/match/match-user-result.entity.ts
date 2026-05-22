import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
} from 'typeorm'
import { Match } from './match.entity'
import { User } from '../users/user.entity'

@Entity({ name: 'match_user_results' })
@Index(['matchId', 'userId'], { unique: true })
export class MatchUserResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  matchId!: string

  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'int' })
  score!: number

  @Column({ type: 'int' })
  lines!: number

  @Column({ type: 'int' })
  level!: number

  @Column({ type: 'int', nullable: true })
  rank!: number | null

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match!: Match

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User
}
