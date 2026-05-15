import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { TwoFa } from '../auth/twofa.entity'

export enum UserType {
  EMAIL = 'email',
  GITHUB = 'github',
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum GameControlAction {
  LEFT = 'left',
  RIGHT = 'right',
  ROTATE = 'rotate',
  SOFT_DROP = 'softDrop',
  HARD_DROP = 'hardDrop',
}

export type GameControls = Record<GameControlAction, string>

export const DEFAULT_GAME_CONTROLS: GameControls = {
  [GameControlAction.LEFT]: 'ArrowLeft',
  [GameControlAction.RIGHT]: 'ArrowRight',
  [GameControlAction.ROTATE]: 'ArrowUp',
  [GameControlAction.SOFT_DROP]: 'ArrowDown',
  [GameControlAction.HARD_DROP]: ' ',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  email!: string

  @Column({ unique: true, default: '' })
  username!: string

  @Column({ type: 'text', default: Theme.LIGHT })
  theme!: Theme

  @Column({
    type: 'jsonb',
    default: () => `'${JSON.stringify(DEFAULT_GAME_CONTROLS)}'::jsonb`,
  })
  gameControls!: GameControls

  @Column({ type: 'text', nullable: true, unique: true })
  profilePictureId!: string | null

  @Column({ type: 'text', default: UserType.EMAIL })
  userType!: UserType

  @Column({ type: 'text', nullable: true, unique: true })
  githubId!: string | null

  @Column({ type: 'text', nullable: true })
  githubAvatarUrl!: string | null

  @Column({ type: 'text', nullable: true })
  password!: string | null

  @Column({ default: false })
  twoFaEnabled!: boolean

  @Column({ type: 'text', nullable: true })
  twoFaSecret!: string | null

  @Column({ default: 1 })
  level!: number

  @Column({ default: 0 })
  matchesPlayed!: number

  @Column({ default: 0 })
  matchesWon!: number

  @Column({ default: 0 })
  matchesLost!: number

  @Column({ default: 0 })
  playTimeInSeconds!: number

  @Column({ default: 0 })
  piecesPlaced!: number

  @Column({ default: 0 })
  totalLinesCleared!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @OneToMany(() => TwoFa, (twofa) => twofa.user)
  twoFaSessions!: TwoFa[]
}
