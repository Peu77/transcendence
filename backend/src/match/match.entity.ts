import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'matches' })
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'int', default: 0 })
  durationSeconds!: number

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date
}
