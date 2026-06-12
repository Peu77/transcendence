import { createRoute } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { userStore } from '@/store/userStore'
import { RoomGamePhase } from '@/components/app/room/room-game-phase.tsx'
import { RoomLobbyPhase } from '@/components/app/room/room-lobby-phase.tsx'
import { useRoomGame } from '@/components/app/room/use-room-game.ts'
import { useRoomSession } from '@/components/app/room/use-room-session.ts'
import { ScreenSupportGate } from '@/components/app/screen-support-gate.tsx'

const RoomPage = () => {
  const { roomId } = RoomRoute.useParams()
  const me = userStore.state
  const { room, error, isLoading } = useRoomSession(roomId)
  const {
    gamePhase,
    countdown,
    playerStates,
    results,
    isChatOpen,
    escapeHoldProgress,
    handleLeaveRoom,
    handleStartGame,
    handleBackToLobby,
  } = useRoomGame(roomId, me, room?.settings)

  const isHost = room?.hostUserId === me?.id

  if (error) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden p-6 text-foreground">
        Redirecting to room lobby...
      </div>
    )
  }

  if (isLoading || !room) {
    return (
      <div className="flex h-full items-center justify-center overflow-hidden p-6 text-foreground">
        Joining room {roomId}...
      </div>
    )
  }

  return (
    <div
      className={`h-full overflow-hidden text-foreground ${gamePhase === 'lobby' ? 'p-4 md:p-6' : ''}`}
    >
      {gamePhase === 'lobby' ? (
        <RoomLobbyPhase
          room={room}
          isHost={isHost}
          onLeaveRoom={handleLeaveRoom}
          onStartGame={handleStartGame}
        />
      ) : (
        <RoomGamePhase
          gamePhase={gamePhase}
          countdown={countdown}
          playerStates={playerStates}
          results={results}
          myUserId={me?.id ?? ''}
          room={room}
          isChatOpen={isChatOpen}
          escapeHoldProgress={escapeHoldProgress}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  )
}

export const RoomRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: () => (
    <ScreenSupportGate>
      <RoomPage />
    </ScreenSupportGate>
  ),
  path: '/room/$roomId',
})
