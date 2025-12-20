import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, In, Repository } from "typeorm";
import { User } from "../users/user.entity";
import {
  FriendRequest,
  FriendRequestStatus,
} from "./entities/friend-request.entity";
import { Friendship } from "./entities/friendship.entity";
import { DirectMessage } from "./entities/direct-message.entity";
import { PresenceStatus, UserPresence } from "./entities/user-presence.entity";
import { isUUID } from "class-validator";

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(FriendRequest)
    private readonly friendRequestsRepo: Repository<FriendRequest>,
    @InjectRepository(Friendship)
    private readonly friendshipsRepo: Repository<Friendship>,
    @InjectRepository(DirectMessage)
    private readonly messagesRepo: Repository<DirectMessage>,
    @InjectRepository(UserPresence)
    private readonly presenceRepo: Repository<UserPresence>,
  ) {}

  private canonicalPair(a: string, b: string): { low: string; high: string } {
    return a < b ? { low: a, high: b } : { low: b, high: a };
  }

  private async assertUserExists(userId: string): Promise<void> {
    const exists = await this.usersRepo.exists({ where: { id: userId } });
    if (!exists) throw new NotFoundException("User not found");
  }

  async sendFriendRequest(
    fromUserId: string,
    toUserIdentifier: string,
  ): Promise<FriendRequest> {
    const toUser = await this.usersRepo.findOneOrFail({
      where: [
        isUUID(toUserIdentifier) ? { id: toUserIdentifier } : {},
        { username: toUserIdentifier }
      ]
    })

    if (fromUserId === toUser.id)
      throw new BadRequestException("Cannot friend yourself");
    await this.assertUserExists(toUser.id);

    const { low, high } = this.canonicalPair(fromUserId, toUser.id);
    const alreadyFriends = await this.friendshipsRepo.exists({
      where: { userLowId: low, userHighId: high },
    });
    if (alreadyFriends) throw new ConflictException("Already friends");

    const existing = await this.friendRequestsRepo.findOne({
      where: [
        { fromUserId, toUserId: toUser.id, status: FriendRequestStatus.PENDING },
        {
          fromUserId: toUser.id,
          toUserId: fromUserId,
          status: FriendRequestStatus.PENDING,
        },
      ],
    });
    if (existing) throw new ConflictException("Friend request already pending");

    const request = this.friendRequestsRepo.create({
      fromUserId,
      toUserId: toUser.id,
      status: FriendRequestStatus.PENDING,
    });
    return await this.friendRequestsRepo.save(request);
  }

  async listIncomingRequests(userId: string): Promise<FriendRequest[]> {
    return await this.friendRequestsRepo.find({
      where: { toUserId: userId, status: FriendRequestStatus.PENDING },
      relations: { fromUser: true },
      order: { createdAt: "DESC" },
    });
  }

  async listOutgoingRequests(userId: string): Promise<FriendRequest[]> {
    return await this.friendRequestsRepo.find({
      where: { fromUserId: userId, status: FriendRequestStatus.PENDING },
      relations: { toUser: true },
      order: { createdAt: "DESC" },
    });
  }

  async acceptRequest(requestId: string, userId: string): Promise<Friendship> {
    const req = await this.friendRequestsRepo.findOne({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException("Friend request not found");
    if (req.status !== FriendRequestStatus.PENDING)
      throw new BadRequestException("Friend request is not pending");
    if (req.toUserId !== userId) throw new ForbiddenException("Not allowed");

    const { low, high } = this.canonicalPair(req.fromUserId, req.toUserId);

    // Transaction-like safety: update request first, then create friendship (unique index handles race).
    req.status = FriendRequestStatus.ACCEPTED;
    await this.friendRequestsRepo.save(req);

    const friendship = this.friendshipsRepo.create({
      userLowId: low,
      userHighId: high,
    });

    try {
      return await this.friendshipsRepo.save(friendship);
    } catch (e) {
      // If friendship already exists due to race, surface conflict.
      throw new ConflictException("Already friends");
    }
  }

  async denyRequest(requestId: string, userId: string): Promise<void> {
    const req = await this.friendRequestsRepo.findOne({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException("Friend request not found");
    if (req.status !== FriendRequestStatus.PENDING)
      throw new BadRequestException("Friend request is not pending");
    if (req.toUserId !== userId) throw new ForbiddenException("Not allowed");

    req.status = FriendRequestStatus.DENIED;
    await this.friendRequestsRepo.save(req);
  }

  async cancelRequest(
    requestId: string,
    userId: string,
  ): Promise<DeleteResult> {
    const req = await this.friendRequestsRepo.findOne({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException("Friend request not found");
    if (req.status !== FriendRequestStatus.PENDING)
      throw new BadRequestException("Friend request is not pending");
    if (req.fromUserId !== userId) throw new ForbiddenException("Not allowed");

    return await this.friendRequestsRepo.delete({ id: requestId });
  }

  async listFriends(userId: string): Promise<
    Array<{
      id: string;
      username: string;
      profilePictureId: string | null;
      presence: { status: PresenceStatus; lastSeenAt: Date | null };
      friendedAt: Date;
    }>
  > {
    const friendships = await this.friendshipsRepo.find({
      where: [{ userLowId: userId }, { userHighId: userId }],
      order: { createdAt: "DESC" },
    });

    const friendIds = friendships.map((f) =>
      f.userLowId === userId ? f.userHighId : f.userLowId,
    );
    if (friendIds.length === 0) return [];

    const [users, presences] = await Promise.all([
      this.usersRepo.find({ where: { id: In(friendIds) } }),
      this.presenceRepo.find({ where: { userId: In(friendIds) } }),
    ]);

    const presenceByUserId = new Map(
      presences.map((p) => [
        p.userId,
        { status: p.status, lastSeenAt: p.lastSeenAt },
      ]),
    );
    const userById = new Map(users.map((u) => [u.id, u]));

    return friendships
      .map((f) => {
        const friendId = f.userLowId === userId ? f.userHighId : f.userLowId;
        const u = userById.get(friendId);
        if (!u) return null;
        return {
          id: u.id,
          username: u.username,
          profilePictureId: u.profilePictureId,
          presence: presenceByUserId.get(u.id) ?? {
            status: PresenceStatus.OFFLINE,
            lastSeenAt: null,
          },
          friendedAt: f.createdAt,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }

  async deleteFriend(userId: string, friendUserId: string): Promise<void> {
    if (userId === friendUserId)
      throw new BadRequestException("Invalid friend");
    const { low, high } = this.canonicalPair(userId, friendUserId);

    const result = await this.friendshipsRepo.delete({
      userLowId: low,
      userHighId: high,
    });
    if (!result.affected) throw new NotFoundException("Friendship not found");
  }

  async updateMyPresence(
    userId: string,
    status: PresenceStatus,
  ): Promise<UserPresence> {
    const now = new Date();
    const lastSeenAt = status === PresenceStatus.OFFLINE ? now : null;

    const existing = await this.presenceRepo.findOne({ where: { userId } });
    if (!existing) {
      const created = this.presenceRepo.create({ userId, status, lastSeenAt });
      return await this.presenceRepo.save(created);
    }

    existing.status = status;
    existing.lastSeenAt = lastSeenAt;
    return await this.presenceRepo.save(existing);
  }

  private async assertFriends(
    userId: string,
    friendUserId: string,
  ): Promise<void> {
    const { low, high } = this.canonicalPair(userId, friendUserId);
    const ok = await this.friendshipsRepo.exists({
      where: { userLowId: low, userHighId: high },
    });
    if (!ok) throw new ForbiddenException("Not friends");
  }

  async sendDirectMessage(
    senderId: string,
    friendUserId: string,
    content: string,
  ): Promise<DirectMessage> {
    if (!content.trim())
      throw new BadRequestException("Message cannot be empty");
    await this.assertFriends(senderId, friendUserId);

    const msg = this.messagesRepo.create({
      senderId,
      recipientId: friendUserId,
      content,
    });
    return await this.messagesRepo.save(msg);
  }

  async getDirectMessages(
    userId: string,
    friendUserId: string,
    opts: { limit?: number; before?: string; after?: string },
  ): Promise<{
    messages: DirectMessage[];
    pageInfo: {
      hasOlder: boolean;
      hasNewer: boolean;
      oldestCursor: string | null;
      newestCursor: string | null;
    };
  }> {
    await this.assertFriends(userId, friendUserId);

    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 100);

    if (opts.before && opts.after) {
      throw new BadRequestException("Use either 'before' or 'after', not both");
    }

    const baseWhere = [
      { senderId: userId, recipientId: friendUserId },
      { senderId: friendUserId, recipientId: userId },
    ];

    const qb = this.messagesRepo.createQueryBuilder("m").where(baseWhere);

    // Cursor semantics:
    // - before: return older than the cursor message
    // - after: return newer than the cursor message
    if (opts.before) {
      const cursor = await this.messagesRepo.findOne({
        where: { id: opts.before },
      });
      if (!cursor) throw new NotFoundException("Cursor message not found");
      qb.andWhere(
        "m.createdAt < :cursorCreatedAt OR (m.createdAt = :cursorCreatedAt AND m.id < :cursorId)",
        {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      );
      qb.orderBy("m.createdAt", "DESC").addOrderBy("m.id", "DESC").take(limit);
    } else if (opts.after) {
      const cursor = await this.messagesRepo.findOne({
        where: { id: opts.after },
      });
      if (!cursor) throw new NotFoundException("Cursor message not found");
      qb.andWhere(
        "m.createdAt > :cursorCreatedAt OR (m.createdAt = :cursorCreatedAt AND m.id > :cursorId)",
        {
          cursorCreatedAt: cursor.createdAt,
          cursorId: cursor.id,
        },
      );
      qb.orderBy("m.createdAt", "ASC").addOrderBy("m.id", "ASC").take(limit);
    } else {
      qb.orderBy("m.createdAt", "DESC").addOrderBy("m.id", "DESC").take(limit);
    }

    let messages = await qb.getMany();

    // Normalize output order always ascending by time so UI can render naturally.
    if (!opts.after) {
      messages = messages.reverse();
    }

    const oldest = messages[0] ?? null;
    const newest = messages[messages.length - 1] ?? null;

    // pageInfo: compute whether there are older/newer messages around the returned window.
    let hasOlder = false;
    let hasNewer = false;

    if (oldest) {
      const olderCount = await this.messagesRepo
        .createQueryBuilder("m")
        .where(baseWhere)
        .andWhere("m.createdAt < :t OR (m.createdAt = :t AND m.id < :id)", {
          t: oldest.createdAt,
          id: oldest.id,
        })
        .take(1)
        .getCount();
      hasOlder = olderCount > 0;
    }

    if (newest) {
      const newerCount = await this.messagesRepo
        .createQueryBuilder("m")
        .where(baseWhere)
        .andWhere("m.createdAt > :t OR (m.createdAt = :t AND m.id > :id)", {
          t: newest.createdAt,
          id: newest.id,
        })
        .take(1)
        .getCount();
      hasNewer = newerCount > 0;
    }

    return {
      messages,
      pageInfo: {
        hasOlder,
        hasNewer,
        oldestCursor: oldest?.id ?? null,
        newestCursor: newest?.id ?? null,
      },
    };
  }
}
