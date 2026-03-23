import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { FriendsService } from '../src/friends/friends.service'
import { User } from '../src/users/user.entity'
import { TwoFa } from '../src/auth/twofa.entity'
import { FriendRequest } from '../src/friends/entities/friend-request.entity'
import { Friendship } from '../src/friends/entities/friendship.entity'
import { DirectMessage } from '../src/friends/entities/direct-message.entity'
import {
  UserPresence,
  PresenceStatus,
} from '../src/friends/entities/user-presence.entity'
import { FriendsModule } from '../src/friends/friends.module'
import { Repository } from 'typeorm'

describe('FriendsService (integration)', () => {
  let app: INestApplication
  let service: FriendsService

  let usersRepo: Repository<User>
  let requestsRepo: Repository<FriendRequest>
  let friendshipsRepo: Repository<Friendship>
  let messagesRepo: Repository<DirectMessage>
  let presenceRepo: Repository<UserPresence>

  let userA: User
  let userB: User
  let userC: User

  const createUser = async (overrides: Partial<User>): Promise<User> => {
    const now = new Date()
    return await usersRepo.save({
      email:
        overrides.email ?? `u_${Math.random().toString(16).slice(2)}@a.com`,
      username:
        overrides.username ?? `u_${Math.random().toString(16).slice(2)}`,
      password: overrides.password ?? 'x',
      profilePictureId: overrides.profilePictureId ?? null,
      twoFaEnabled: overrides.twoFaEnabled ?? false,
      twoFaSecret: overrides.twoFaSecret ?? null,
      createdAt: overrides.createdAt ?? now,
      ...overrides,
    })
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.getOrThrow<string>('DB_HOST'),
            port: config.getOrThrow<number>('DB_PORT'),
            username: config.getOrThrow<string>('DB_USER'),
            password: config.getOrThrow<string>('DB_PASSWORD'),
            database: config.getOrThrow<string>('DB_NAME'),
            schema: 'test',
            entities: [
              User,
              TwoFa,
              FriendRequest,
              Friendship,
              DirectMessage,
              UserPresence,
            ],
            synchronize: true,
          }),
        }),
        FriendsModule,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
    await app.init()

    service = moduleRef.get(FriendsService)

    usersRepo = moduleRef.get('UserRepository')
    requestsRepo = moduleRef.get('FriendRequestRepository')
    friendshipsRepo = moduleRef.get('FriendshipRepository')
    messagesRepo = moduleRef.get('DirectMessageRepository')
    presenceRepo = moduleRef.get('UserPresenceRepository')
  })

  async function clearDatabase() {
    await messagesRepo.createQueryBuilder().delete().execute()
    await requestsRepo.createQueryBuilder().delete().execute()
    await friendshipsRepo.createQueryBuilder().delete().execute()
    await presenceRepo.createQueryBuilder().delete().execute()
    await usersRepo.createQueryBuilder().delete().execute()
  }

  beforeEach(async () => {
    await clearDatabase()

    userA = await createUser({ email: 'a@a.com', username: 'a' })
    userB = await createUser({ email: 'b@b.com', username: 'b' })
    userC = await createUser({ email: 'c@c.com', username: 'c' })
  })

  afterAll(async () => {
    await clearDatabase()
    if (app) await app.close()
  })

  it('creates friendship by accepting request and can send messages', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    const msg = await service.sendDirectMessage(userA.id, userB.id, 'hello')
    expect(msg.content).toBe('hello')

    const page = await service.getDirectMessages(userA.id, userB.id, {
      limit: 10,
    })
    expect(page.messages).toHaveLength(1)
    expect(page.messages[0].id).toBe(msg.id)
  })

  it('rejects friend request to self', async () => {
    await expect(service.sendFriendRequest(userA.id, userA.id)).rejects.toThrow(
      'Cannot friend yourself',
    )
  })

  it('rejects duplicate outgoing friend request', async () => {
    await service.sendFriendRequest(userA.id, userB.id)
    await expect(service.sendFriendRequest(userA.id, userB.id)).rejects.toThrow(
      /already/i,
    )
  })

  it('rejects cross-pending requests (A->B then B->A)', async () => {
    await service.sendFriendRequest(userA.id, userB.id)
    await expect(service.sendFriendRequest(userB.id, userA.id)).rejects.toThrow(
      /pending|already/i,
    )
  })

  it('rejects sending a request when already friends', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    await expect(service.sendFriendRequest(userA.id, userB.id)).rejects.toThrow(
      'Already friends',
    )
  })

  it('only the recipient can accept a request', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await expect(service.acceptRequest(req.id, userC.id)).rejects.toThrow(
      'Not allowed',
    )
  })

  it('cannot accept a request twice', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)
    await expect(service.acceptRequest(req.id, userB.id)).rejects.toThrow(
      'Friend request is not pending',
    )
  })

  it('only the recipient can deny a request', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await expect(service.denyRequest(req.id, userA.id)).rejects.toThrow(
      'Not allowed',
    )
  })

  it('denyRequest marks the request and does not create friendship', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.denyRequest(req.id, userB.id)

    await expect(
      service.sendDirectMessage(userA.id, userB.id, 'hi'),
    ).rejects.toThrow('Not friends')

    // Denied requests remain in the DB, so repeating the same request is still a conflict.
    await expect(service.sendFriendRequest(userA.id, userB.id)).rejects.toThrow(
      'Friend request already sent',
    )
  })

  it('only the sender can cancel a request', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await expect(service.cancelRequest(req.id, userB.id)).rejects.toThrow(
      'Not allowed',
    )
  })

  it('cancelRequest removes the request', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.cancelRequest(req.id, userA.id)

    const incoming = await service.listIncomingRequests(userB.id)
    expect(incoming).toHaveLength(0)

    const outgoing = await service.listOutgoingRequests(userA.id)
    expect(outgoing).toHaveLength(0)
  })

  it('sendDirectMessage rejects empty/whitespace content', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    await expect(
      service.sendDirectMessage(userA.id, userB.id, '   \n\t'),
    ).rejects.toThrow('Message cannot be empty')
  })

  it('sendDirectMessage rejects when users are not friends', async () => {
    await expect(
      service.sendDirectMessage(userA.id, userB.id, 'yo'),
    ).rejects.toThrow('Not friends')
  })

  it('getDirectMessages rejects when users are not friends', async () => {
    await expect(
      service.getDirectMessages(userA.id, userB.id, { limit: 10 }),
    ).rejects.toThrow('Not friends')
  })

  it('getDirectMessages rejects when both before and after are provided', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    await service.sendDirectMessage(userA.id, userB.id, 'm1')

    await expect(
      service.getDirectMessages(userA.id, userB.id, {
        before: '00000000-0000-0000-0000-000000000000',
        after: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow("Use either 'before' or 'after'")
  })

  it('getDirectMessages rejects when cursor message does not exist', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    await expect(
      service.getDirectMessages(userA.id, userB.id, {
        before: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow('Cursor message not found')
  })

  it('listFriends returns offline presence by default and reflects presence updates', async () => {
    expect(await service.listFriends(userA.id)).toEqual([])

    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    const friendsA1 = await service.listFriends(userA.id)
    expect(friendsA1).toHaveLength(1)
    expect(friendsA1[0].id).toBe(userB.id)
    expect(friendsA1[0].presence.status).toBe(PresenceStatus.OFFLINE)
    expect(friendsA1[0].presence.lastSeenAt).toBeNull()

    await service.updateMyPresence(userB.id, PresenceStatus.ONLINE)
    const friendsA2 = await service.listFriends(userA.id)
    expect(friendsA2[0].presence.status).toBe(PresenceStatus.ONLINE)

    const presence = await service.updateMyPresence(
      userB.id,
      PresenceStatus.OFFLINE,
    )
    expect(presence.lastSeenAt).not.toBeNull()

    const friendsA3 = await service.listFriends(userA.id)
    expect(friendsA3[0].presence.status).toBe(PresenceStatus.OFFLINE)
    expect(friendsA3[0].presence.lastSeenAt).not.toBeNull()
  })

  it('deleteFriend removes friendship and prevents further messaging', async () => {
    const req = await service.sendFriendRequest(userA.id, userB.id)
    await service.acceptRequest(req.id, userB.id)

    await service.sendDirectMessage(userA.id, userB.id, 'before delete')

    await service.deleteFriend(userA.id, userB.id)

    await expect(
      service.sendDirectMessage(userA.id, userB.id, 'after delete'),
    ).rejects.toThrow('Not friends')

    expect(await service.listFriends(userA.id)).toHaveLength(0)
    expect(await service.listFriends(userB.id)).toHaveLength(0)
  })

  it('deleteFriend rejects deleting yourself', async () => {
    await expect(service.deleteFriend(userA.id, userA.id)).rejects.toThrow(
      'Invalid friend',
    )
  })
})
