import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { TwoFa } from "../auth/twofa.entity";

@Entity({ name: "users" })
export class User {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true, default: "" })
  username: string;

  @Column({ type: "text", nullable: true, unique: true })
  profilePictureId: string | null;

  @Column()
  password: string;

  @Column({ default: false })
  twoFaEnabled: boolean;

  @Column({ type: "text", nullable: true })
  twoFaSecret: string | null;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @OneToMany(() => TwoFa, (twofa) => twofa.user)
  twoFaSessions: TwoFa[];
}
