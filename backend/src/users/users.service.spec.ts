import { Repository } from 'typeorm'
import { UserBlock } from '../friends/entities/block.entity'
import { Friendship } from '../friends/entities/friendship.entity'
import { MatchResult } from './match-result.entity'
import {
  DEFAULT_GAME_CONTROLS,
  DEFAULT_TETRIS_HANDLING_SETTINGS,
  GameControlAction,
  GameControls,
  Theme,
  User,
  UserType,
} from './user.entity'
import { UsersService } from './users.service'

const createUsersRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  existsBy: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
  update: jest.fn(),
})

const createMatchResultsRepo = () => ({
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
})

const createUserBlocksRepo = () => ({
  exists: jest.fn(),
})

const createFriendshipsRepo = () => ({
  findOne: jest.fn(),
})

const createService = () => {
  const usersRepo = createUsersRepo()
  const matchResultsRepo = createMatchResultsRepo()
  const userBlocksRepo = createUserBlocksRepo()
  const friendshipsRepo = createFriendshipsRepo()

  return {
    usersRepo,
    matchResultsRepo,
    userBlocksRepo,
    friendshipsRepo,
    service: new UsersService(
      usersRepo as unknown as Repository<User>,
      matchResultsRepo as unknown as Repository<MatchResult>,
      userBlocksRepo as unknown as Repository<UserBlock>,
      friendshipsRepo as unknown as Repository<Friendship>,
    ),
  }
}

describe('UsersService account lookup and creation', () => {
  let context: ReturnType<typeof createService>

  beforeEach(() => {
    context = createService()
  })

  it('stores newly created emails and usernames in lowercase', async () => {
    const createdUser = { username: 'mixedcase' } as User
    context.usersRepo.create.mockReturnValue(createdUser)
    context.usersRepo.save.mockResolvedValue(createdUser)

    await context.service.createUser(
      UserType.EMAIL,
      'USER@EXAMPLE.COM',
      'MixedCase',
      'hash',
      null,
      null,
    )

    expect(context.usersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        username: 'mixedcase',
      }),
    )
    expect(context.usersRepo.save).toHaveBeenCalledWith(createdUser)
  })

  it('normalizes emails and usernames before existence checks', async () => {
    context.usersRepo.existsBy.mockResolvedValue(true)

    await expect(
      context.service.existsByEmail('USER@EXAMPLE.COM'),
    ).resolves.toBe(true)
    await expect(context.service.existsByUsername('MixedCase')).resolves.toBe(
      true,
    )

    expect(context.usersRepo.existsBy).toHaveBeenNthCalledWith(1, {
      email: 'user@example.com',
    })
    expect(context.usersRepo.existsBy).toHaveBeenNthCalledWith(2, {
      username: 'mixedcase',
    })
  })

  it('normalizes emails before lookup', async () => {
    context.usersRepo.findOne.mockResolvedValue(null)

    await expect(context.service.findByEmail('USER@EXAMPLE.COM')).resolves.toBe(
      null,
    )

    expect(context.usersRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    })
  })

  it('reuses an existing GitHub user instead of creating a duplicate', async () => {
    const existingUser = { id: 'user-1' } as User
    jest
      .spyOn(context.service, 'findByGithubId')
      .mockResolvedValue(existingUser)
    const createUserSpy = jest.spyOn(context.service, 'createUser')

    await expect(
      context.service.upsertGithubUser({
        githubId: 'github-1',
        email: 'user@example.com',
        username: 'github-user',
        avatarUrl: 'https://example.com/avatar.png',
      }),
    ).resolves.toBe(existingUser)

    expect(createUserSpy).not.toHaveBeenCalled()
  })

  it('creates a GitHub user when the GitHub id is unknown', async () => {
    const createdUser = { id: 'user-1' } as User
    jest.spyOn(context.service, 'findByGithubId').mockResolvedValue(null)
    jest.spyOn(context.service, 'createUser').mockResolvedValue(createdUser)

    await expect(
      context.service.upsertGithubUser({
        githubId: 'github-1',
        email: 'user@example.com',
        username: 'github-user',
        avatarUrl: 'https://example.com/avatar.png',
      }),
    ).resolves.toBe(createdUser)

    expect(context.service.createUser).toHaveBeenCalledWith(
      UserType.GITHUB,
      'user@example.com',
      'github-user',
      null,
      'github-1',
      'https://example.com/avatar.png',
    )
  })
})

describe('UsersService profile preferences', () => {
  let context: ReturnType<typeof createService>

  beforeEach(() => {
    context = createService()
  })

  it.each([
    [Theme.LIGHT, Theme.DARK],
    [Theme.DARK, Theme.LIGHT],
  ])('toggles theme from %s to %s', async (currentTheme, expectedTheme) => {
    context.usersRepo.findOneOrFail.mockResolvedValue({ theme: currentTheme })

    await expect(context.service.toggleTheme('user-1')).resolves.toBe(
      expectedTheme,
    )

    expect(context.usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { theme: expectedTheme },
    )
  })

  it('updates two-factor flags and clears the secret when disabling 2FA', async () => {
    await context.service.updateTwoFaSecret('user-1', 'secret')
    await context.service.enableTwoFa('user-1')
    await context.service.disableTwoFa('user-1')

    expect(context.usersRepo.update).toHaveBeenNthCalledWith(
      1,
      { id: 'user-1' },
      { twoFaSecret: 'secret' },
    )
    expect(context.usersRepo.update).toHaveBeenNthCalledWith(
      2,
      { id: 'user-1' },
      { twoFaEnabled: true },
    )
    expect(context.usersRepo.update).toHaveBeenNthCalledWith(
      3,
      { id: 'user-1' },
      { twoFaEnabled: false, twoFaSecret: null },
    )
  })

  it('updates profile picture ids, including clearing them', async () => {
    await context.service.updateProfilePictureId('user-1', null)

    expect(context.usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      { profilePictureId: null },
    )
  })
})

describe('UsersService controls and handling settings', () => {
  let context: ReturnType<typeof createService>

  beforeEach(() => {
    context = createService()
  })

  it('fills missing game controls from defaults and ignores empty bindings', () => {
    const controls = context.service.normalizeGameControls({
      [GameControlAction.LEFT]: 'h',
      [GameControlAction.RIGHT]: '',
      [GameControlAction.HARD_DROP]: 'Enter',
    })

    expect(controls).toEqual({
      ...DEFAULT_GAME_CONTROLS,
      [GameControlAction.LEFT]: 'h',
      [GameControlAction.RIGHT]: DEFAULT_GAME_CONTROLS[GameControlAction.RIGHT],
      [GameControlAction.HARD_DROP]: 'Enter',
    })
  })

  it('persists normalized game controls', async () => {
    const controls: Partial<GameControls> = {
      [GameControlAction.LEFT]: 'h',
      [GameControlAction.RIGHT]: 'l',
    }

    await expect(
      context.service.updateGameControls('user-1', controls),
    ).resolves.toMatchObject({
      [GameControlAction.LEFT]: 'h',
      [GameControlAction.RIGHT]: 'l',
      [GameControlAction.HARD_DROP]:
        DEFAULT_GAME_CONTROLS[GameControlAction.HARD_DROP],
    })

    expect(context.usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      {
        gameControls: expect.objectContaining({
          [GameControlAction.LEFT]: 'h',
          [GameControlAction.RIGHT]: 'l',
        }),
      },
    )
  })

  it('rounds finite tetris handling values and clamps them to supported limits', () => {
    expect(
      context.service.normalizeTetrisHandlingSettings({
        arr: -10,
        das: 167.6,
        dcd: Number.POSITIVE_INFINITY,
        sdf: 2000,
      }),
    ).toEqual({
      ...DEFAULT_TETRIS_HANDLING_SETTINGS,
      arr: 0,
      das: 168,
      dcd: DEFAULT_TETRIS_HANDLING_SETTINGS.dcd,
      sdf: 1000,
    })
  })

  it('persists normalized tetris handling settings', async () => {
    await expect(
      context.service.updateTetrisHandlingSettings('user-1', {
        arr: 0.4,
        das: 1001,
      }),
    ).resolves.toMatchObject({
      arr: 0,
      das: 1000,
      dcd: DEFAULT_TETRIS_HANDLING_SETTINGS.dcd,
      sdf: DEFAULT_TETRIS_HANDLING_SETTINGS.sdf,
    })

    expect(context.usersRepo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      {
        tetrisHandlingSettings: expect.objectContaining({
          arr: 0,
          das: 1000,
        }),
      },
    )
  })
})

describe('UsersService match statistics', () => {
  let context: ReturnType<typeof createService>

  beforeEach(() => {
    context = createService()
  })

  it('builds match history with placements sorted by score then lines', async () => {
    const playedAt = new Date('2026-06-10T12:00:00.000Z')
    context.matchResultsRepo.find
      .mockResolvedValueOnce([
        {
          matchId: 'match-1',
          roomId: 'room-1',
          userId: 'user-1',
          score: 500,
          lines: 2,
          state: { level: 3 },
          createdAt: playedAt,
        },
      ])
      .mockResolvedValueOnce([
        {
          matchId: 'match-1',
          userId: 'user-1',
          score: 500,
          lines: 2,
          state: { level: 3 },
          user: { username: 'alice', profilePictureId: 'alice-pic' },
        },
        {
          matchId: 'match-1',
          userId: 'user-2',
          score: 500,
          lines: 4,
          state: { level: 5 },
          user: { username: 'bob', profilePictureId: null },
        },
        {
          matchId: 'match-1',
          userId: 'user-3',
          score: 300,
          lines: 10,
          state: { level: 2 },
          user: { username: 'carol', profilePictureId: 'carol-pic' },
        },
      ])

    await expect(context.service.getMatchHistory('user-1')).resolves.toEqual([
      {
        matchId: 'match-1',
        roomId: 'room-1',
        playedAt,
        placement: 2,
        playerCount: 3,
        score: 500,
        lines: 2,
        level: 3,
        players: [
          {
            userId: 'user-2',
            username: 'bob',
            profilePictureId: null,
            score: 500,
            lines: 4,
            level: 5,
            placement: 1,
          },
          {
            userId: 'user-1',
            username: 'alice',
            profilePictureId: 'alice-pic',
            score: 500,
            lines: 2,
            level: 3,
            placement: 2,
          },
          {
            userId: 'user-3',
            username: 'carol',
            profilePictureId: 'carol-pic',
            score: 300,
            lines: 10,
            level: 2,
            placement: 3,
          },
        ],
      },
    ])
  })

  it('returns an empty match history without loading all match results', async () => {
    context.matchResultsRepo.find.mockResolvedValueOnce([])

    await expect(context.service.getMatchHistory('user-1')).resolves.toEqual([])

    expect(context.matchResultsRepo.find).toHaveBeenCalledTimes(1)
  })

  it('maps global ranking aggregate strings to numbers', async () => {
    const getRawMany = jest.fn().mockResolvedValue([
      {
        userId: 'user-1',
        username: 'alice',
        profilePictureId: null,
        wins: '2',
        matchesPlayed: '3',
      },
    ])
    const queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getRawMany,
    }
    context.matchResultsRepo.createQueryBuilder.mockReturnValue(queryBuilder)

    await expect(context.service.getGlobalRanking()).resolves.toEqual([
      {
        userId: 'user-1',
        username: 'alice',
        profilePictureId: null,
        wins: 2,
        matchesPlayed: 3,
      },
    ])

    expect(queryBuilder.orderBy).toHaveBeenCalledWith(
      'SUM(CASE WHEN result.placement = 1 THEN 1 ELSE 0 END)',
      'DESC',
    )
  })
})
