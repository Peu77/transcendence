import { RealtimeService } from '../realtime/realtime.service'
import { UsersService } from '../users/users.service'
import { RoomService } from './room.service'

describe('RoomService.isUserInRoom', () => {
  it('detects a host before they join the room user list', () => {
    const service = new RoomService(
      { emitRoomsUpdated: jest.fn() } as unknown as RealtimeService,
      {} as UsersService,
    )

    service.createNewRoom('host-id')

    expect(service.isUserInRoom('host-id')).toBe(true)
  })

  it('detects users in waiting rooms', async () => {
    const service = new RoomService(
      {
        emitRoomsUpdated: jest.fn(),
        emitToRoom: jest.fn(),
      } as unknown as RealtimeService,
      {
        getUserInfo: jest.fn().mockResolvedValue({
          username: 'player',
          profilePictureId: null,
        }),
      } as unknown as UsersService,
    )
    const room = service.createNewRoom('host-id')

    await service.joinRoom(room.id, 'player-id')

    expect(service.isUserInRoom('player-id')).toBe(true)
  })
})
