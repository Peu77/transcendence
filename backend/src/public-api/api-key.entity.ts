import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ name: 'api_keys' })
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  userId!: string

  @Column()
  name!: string

  @Index({ unique: true })
  @Column()
  keyHash!: string

  @Column({ length: 16 })
  keyPreview!: string

  @Column({ default: 60 })
  rateLimitPerMinute!: number

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt!: Date | null

  @Column({ type: 'timestamp', nullable: true })
  revokedAt!: Date | null

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
