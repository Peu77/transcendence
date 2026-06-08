import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { TwoFa } from '../auth/twofa.entity'
import { MatchResult } from './match-result.entity'

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
  HOLD = 'hold',
  TOGGLE_CHAT = 'toggleChat',
}

export type GameControls = Record<GameControlAction, string>

export type TetrisHandlingSettings = {
  arr: number
  das: number
  dcd: number
  sdf: number
}

export const DEFAULT_GAME_CONTROLS: GameControls = {
  [GameControlAction.LEFT]: 'ArrowLeft',
  [GameControlAction.RIGHT]: 'ArrowRight',
  [GameControlAction.ROTATE]: 'ArrowUp',
  [GameControlAction.SOFT_DROP]: 'ArrowDown',
  [GameControlAction.HARD_DROP]: ' ',
  [GameControlAction.HOLD]: 'c',
  [GameControlAction.TOGGLE_CHAT]: 't',
}

export const DEFAULT_TETRIS_HANDLING_SETTINGS: TetrisHandlingSettings = {
  arr: 33,
  das: 167,
  dcd: 0,
  sdf: 33,
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

  @Column({
    type: 'jsonb',
    default: () =>
      `'${JSON.stringify(DEFAULT_TETRIS_HANDLING_SETTINGS)}'::jsonb`,
  })
  tetrisHandlingSettings!: TetrisHandlingSettings

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

  @OneToMany(() => MatchResult, (matchResult) => matchResult.user)
  matchResults!: MatchResult[]
}
