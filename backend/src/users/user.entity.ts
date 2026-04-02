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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @OneToMany(() => TwoFa, (twofa) => twofa.user)
  twoFaSessions!: TwoFa[]
}
