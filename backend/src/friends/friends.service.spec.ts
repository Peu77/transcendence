import { ConflictException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { RealtimeService } from '../realtime/realtime.service'
import { RoomService } from '../room/room.service'
import { User } from '../users/user.entity'
import { UsersService } from '../users/users.service'
import { DirectMessage } from './entities/direct-message.entity'
import { UserBlock } from './entities/block.entity'
import { FriendRequest } from './entities/friend-request.entity'
import { Friendship } from './entities/friendship.entity'
import { UserPresence } from './entities/user-presence.entity'
import { FriendsService } from './friends.service'

describe('FriendsService.sendMatchInvite', () => {
  it('does not create a room when the sender is already in a room', async () => {
    const friendshipsRepo = {
      exists: jest.fn().mockResolvedValue(true),
    }
    const messagesRepo = {
      create: jest.fn(),
      save: jest.fn(),
    }
    const userService = {
      getUserInfo: jest.fn().mockResolvedValue({ username: 'sender' }),
    }
    const roomService = {
      isUserInRoom: jest.fn().mockReturnValue(true),
      createNewRoom: jest.fn(),
    }

    const service = new FriendsService(
      {} as Repository<User>,
      {} as Repository<FriendRequest>,
      friendshipsRepo as unknown as Repository<Friendship>,
      messagesRepo as unknown as Repository<DirectMessage>,
      {} as Repository<UserPresence>,
      {} as Repository<UserBlock>,
      {} as RealtimeService,
      userService as unknown as UsersService,
      roomService as unknown as RoomService,
    )

    await expect(
      service.sendMatchInvite('sender-id', 'friend-id'),
    ).rejects.toThrow(new ConflictException('You are already in a room'))

    expect(roomService.createNewRoom).not.toHaveBeenCalled()
    expect(messagesRepo.create).not.toHaveBeenCalled()
    expect(messagesRepo.save).not.toHaveBeenCalled()
  })
})

describe('FriendsService direct-message read state', () => {
  const createService = (messagesRepo: object, friendshipsRepo: object = {}) =>
    new FriendsService(
      {} as Repository<User>,
      {} as Repository<FriendRequest>,
      friendshipsRepo as unknown as Repository<Friendship>,
      messagesRepo as unknown as Repository<DirectMessage>,
      {} as Repository<UserPresence>,
      {} as Repository<UserBlock>,
      {} as RealtimeService,
      {} as UsersService,
      {} as RoomService,
    )

  it('groups unseen messages addressed to the user by sender', async () => {
    const getRawMany = jest.fn().mockResolvedValue([
      { senderId: 'first-sender', count: '2' },
      { senderId: 'second-sender', count: '1' },
    ])
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany,
    }
    const messagesRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    }
    const service = createService(messagesRepo)

    await expect(
      service.getUnreadDirectMessages('recipient-id'),
    ).resolves.toEqual({
      count: 3,
      bySender: {
        'first-sender': 2,
        'second-sender': 1,
      },
    })
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'message.recipientId = :userId',
      { userId: 'recipient-id' },
    )
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('message.seen = :seen', {
      seen: false,
    })
  })

  it('marks unseen messages from a friend as seen', async () => {
    const friendshipsRepo = {
      exists: jest.fn().mockResolvedValue(true),
    }
    const messagesRepo = {
      update: jest.fn().mockResolvedValue({ affected: 2 }),
    }
    const service = createService(messagesRepo, friendshipsRepo)

    await expect(
      service.markDirectMessagesSeen('recipient-id', 'sender-id'),
    ).resolves.toBe(2)
    expect(messagesRepo.update).toHaveBeenCalledWith(
      {
        senderId: 'sender-id',
        recipientId: 'recipient-id',
        seen: false,
      },
      { seen: true },
    )
  })
})
