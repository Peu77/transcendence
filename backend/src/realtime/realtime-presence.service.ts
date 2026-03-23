import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Friendship } from '../friends/entities/friendship.entity'
import {
  PresenceStatus,
  UserPresence,
} from '../friends/entities/user-presence.entity'
import { RealtimeService } from './realtime.service'

@Injectable()
export class RealtimePresenceService {
  constructor(
    @InjectRepository(UserPresence)
    private readonly presenceRepo: Repository<UserPresence>,
    @InjectRepository(Friendship)
    private readonly friendshipsRepo: Repository<Friendship>,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Sets the user's presence to OFFLINE and broadcasts to their friends.
   * Best-effort: if user has no friends, still upserts the presence row.
   */
  async setOffline(userId: string): Promise<void> {
    const now = new Date()

    const existing = await this.presenceRepo.findOne({ where: { userId } })
    const presence = existing
      ? await this.presenceRepo.save(
          Object.assign(existing, {
            status: PresenceStatus.OFFLINE,
            lastSeenAt: now,
          }),
        )
      : await this.presenceRepo.save(
          this.presenceRepo.create({
            userId,
            status: PresenceStatus.OFFLINE,
            lastSeenAt: now,
          }),
        )

    const friendships = await this.friendshipsRepo.find({
      where: [{ userLowId: userId }, { userHighId: userId }],
    })

    const friendIds = friendships.map((f) =>
      f.userLowId === userId ? f.userHighId : f.userLowId,
    )

    if (friendIds.length === 0) return

    this.realtime.emitPresenceUpdated(friendIds, {
      userId,
      status: presence.status,
      lastSeenAt: presence.lastSeenAt
        ? presence.lastSeenAt.toISOString()
        : null,
      updatedAt: presence.updatedAt.toISOString(),
    })
  }
}
