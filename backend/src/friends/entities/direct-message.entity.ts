import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../users/user.entity'

export type DirectMessageType = 'text' | 'match_invite'

@Entity({ name: 'direct_messages' })
@Index(['senderId', 'recipientId', 'createdAt'])
export class DirectMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  senderId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender!: User

  @Column('uuid')
  recipientId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  recipient!: User

  @Column({ type: 'text' })
  content!: string

  @Column({ type: 'text', default: 'text' })
  type!: DirectMessageType

  @Column({ type: 'text', nullable: true })
  roomId!: string | null

  @CreateDateColumn()
  createdAt!: Date
}
