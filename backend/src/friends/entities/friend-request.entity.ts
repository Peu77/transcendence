import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/user.entity";

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  DENIED = "denied",
}

@Entity({ name: "friend_requests" })
@Index(["fromUserId", "toUserId"], { unique: true })
export class FriendRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("uuid")
  fromUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  fromUser: User;

  @Column("uuid")
  toUserId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  toUser: User;

  @Column({
    type: "enum",
    enum: FriendRequestStatus,
    default: FriendRequestStatus.PENDING,
  })
  status: FriendRequestStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
