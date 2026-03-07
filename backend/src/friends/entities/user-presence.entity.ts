import {
  Column,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'
import { User } from '../../users/user.entity'

export enum PresenceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AWAY = 'away',
}

@Entity({ name: 'user_presence' })
export class UserPresence {
  @PrimaryColumn('uuid')
  userId: string

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  user: User

  @Column({
    type: 'enum',
    enum: PresenceStatus,
    default: PresenceStatus.OFFLINE,
  })
  status: PresenceStatus

  @Column({ type: 'timestamp', nullable: true })
  lastSeenAt: Date | null

  @UpdateDateColumn()
  updatedAt: Date
}
