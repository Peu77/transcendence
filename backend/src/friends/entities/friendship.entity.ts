import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";
import { User } from "../../users/user.entity";

@Entity({ name: "friendships" })
@Index(["userLowId", "userHighId"], { unique: true })
export class Friendship {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Canonical ordering: userLowId < userHighId (string compare works for UUID for deterministic ordering)
  @Column("uuid")
  userLowId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  userLow: User;

  @Column("uuid")
  userHighId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  userHigh: User;

  @CreateDateColumn()
  createdAt: Date;
}

