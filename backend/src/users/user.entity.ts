import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { TwoFa } from '../auth/twofa.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true, unique: true })
  profilePictureId: string | null;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'boolean', default: false })
  twoFaEnabled: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFaSecret: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToMany(() => TwoFa, (twofa) => twofa.user)
  twoFaSessions: TwoFa[];
}
