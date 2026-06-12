import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { User } from '../../users/user.entity'

@Entity({ name: 'user_blocks' })
@Index(['blockerId', 'blockedId'], { unique: true })
export class UserBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column('uuid')
  blockerId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  blocker!: User

  @Column('uuid')
  blockedId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  blocked!: User

  @CreateDateColumn()
  createdAt!: Date
}
