import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity({ name: 'users_2fa' })
export class TwoFa {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, (user) => user.twoFaSessions, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'varchar' })
  secret: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiredAt: Date;
}
