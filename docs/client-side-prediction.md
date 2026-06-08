# Client-Side Prediction with Server Reconciliation

## The Problem

In a server-authoritative multiplayer game, every player input follows this path:

```
Player presses key
    --> Input sent over network to server
        --> Server processes input, updates game state
            --> Server broadcasts new state to all clients
                --> Client renders updated state
```

On a LAN connection with ~5ms latency this is imperceptible. On a typical internet connection with 50-150ms round-trip time, the player experiences a visible delay between pressing a key and seeing the piece move. At 200ms+ (mobile networks, cross-continent play), the game becomes unplayable.

## The Solution

Client-side prediction eliminates perceived latency by running game logic locally in addition to on the server. The client applies inputs instantly for visual feedback while the server remains the authoritative source of truth.

```
Player presses key
    --> Input applied LOCALLY (instant visual feedback)
    --> Input sent to server (with sequence number)
        --> Server processes input, echoes lastSeq
            --> Client reconciles: snap to server truth, replay unacked inputs
```

The player sees their piece move immediately. If the prediction was correct (which it almost always is for Tetris), the server confirmation is invisible. If it was wrong, the client silently corrects itself.

## Architecture Overview

```
                         +-------------------+
                         |      Server       |
                         |   (TetrisGame)    |
                         |   Source of Truth  |
                         +--------+----------+
                                  |
                    game.state {  |  } game.input
                      players,   |    { action, seq }
                      lastSeq,   |
                  predictionPieces|
                                  |
              +-------------------+-------------------+
              |                                       |
    +---------+---------+               +-------------+-----------+
    |   Local Player    |               |     Opponent(s)         |
    |                   |               |                         |
    | prediction.ts     |               | Render server state     |
    | (local TetrisGame |               | directly -- no          |
    |  + input buffer   |               | prediction needed       |
    |  + reconciliation)|               |                         |
    +-------------------+               +-------------------------+
```

Three packages are involved:

| Package | Role |
|---------|------|
| `shared/` | `TetrisGame` class used by both server and client prediction |
| `backend/` | Authoritative game loop, sequence tracking, state broadcast |
| `frontend/` | Prediction engine, input handling, reconciliation |

## How It Works Step-by-Step

### 1. Input Application (Client)

When the player presses a key, two things happen simultaneously:

```
applyInput(action)                    socket.emit('game.input', ...)
       |                                         |
       v                                         v
  Local TetrisGame                          Network to Server
  processes input instantly                 (carries seq number)
       |
       v
  Input stored in buffer:
  { seq: 42, action: 'left' }
```

The local `TetrisGame` instance runs the exact same `processInput()` logic as the server. The input is also saved in a buffer tagged with a monotonically increasing sequence number.

**File:** `frontend/src/game/tetris/prediction.ts`

```typescript
const applyInput = (action: InputAction): number => {
  const seq = ++engine.seqCounter
  engine.localGame.processInput(action)       // instant local update
  engine.inputBuffer.push({ seq, action })    // remember for reconciliation
  engine.predictedState = engine.localGame.getState()
  return seq  // caller sends this to server
}
```

**File:** `frontend/src/components/app/room/use-room-game.ts`

```typescript
const emitInput = (action: InputAction) => {
  const seq = predictionRef.current.applyInput(action)  // apply locally
  socket.emit('game.input', { roomId, action, seq })    // send to server
}
```

### 2. Server Processing

The server receives the input, processes it on its own `TetrisGame` instance, and tracks the latest sequence number per player:

**File:** `backend/src/realtime/realtime.gateway.ts`

```typescript
handleGameInput(client, body) {
  const seq = typeof body.seq === 'number' ? body.seq : 0
  playerGame.lastSeq = seq                        // track latest acked seq
  playerGame.game.processInput(body.action)       // authoritative processing
  this.emitAllPlayerStates(body.roomId)           // broadcast to all clients
}
```

The broadcast includes extra data for prediction:

```typescript
{
  roomId: "abc",
  players: {                          // authoritative game states
    "user1": { board, currentPiece, score, ... },
    "user2": { board, currentPiece, score, ... }
  },
  lastSeq: {                          // last processed seq per player
    "user1": 42,
    "user2": 17
  },
  predictionPieces: {                 // extra next pieces for prediction
    "user1": ["T", "S", "Z", "L"],
    "user2": ["I", "O", "J", "S"]
  }
}
```

### 3. Reconciliation (Client)

When the client receives a `game.state` event, it performs reconciliation -- the core of the prediction system:

```
Server state arrives (lastSeq = 42)
    |
    v
Discard inputs with seq <= 42 (server has processed them)
    |
    v
Snap local game to server's authoritative state
    |
    v
Replay remaining unacknowledged inputs (seq 43, 44, 45...)
    |
    v
Result = predicted state for rendering
```

**File:** `frontend/src/game/tetris/prediction.ts`

```typescript
const reconcile = (serverState, lastSeq, extraPieces) => {
  // 1. Discard acknowledged inputs
  engine.inputBuffer = engine.inputBuffer.filter(i => i.seq > lastSeq)

  // 2. Snap to server truth
  engine.localGame.restoreFromState(serverState, extraPieces)

  // 3. Replay pending inputs
  for (const { action } of engine.inputBuffer) {
    engine.localGame.processInput(action)
  }

  engine.predictedState = engine.localGame.getState()
}
```

### 4. State Composition

The final rendered state combines prediction for the local player with server state for opponents:

```typescript
// Local player: use predicted state (includes unacknowledged inputs)
// Opponents: use server state directly (no prediction needed)
const combined = { ...data.players }
if (myUserId && predicted) {
  combined[myUserId] = predicted
}
setPlayerStates(combined)
```

Opponents are never predicted because their inputs don't pass through this client. Their state updates arrive from the server at tick rate, which is visually acceptable for non-local players.

## The Sequence Number Protocol

Sequence numbers are the mechanism that connects client inputs to server acknowledgments:

```
Time -->

Client:  [input seq=1] [input seq=2] [input seq=3] [input seq=4] [input seq=5]
            |              |              |              |              |
            v              v              v              v              v
Server:  process(1)   process(2)   process(3)
            |                             |
            v                             v
         emit state                   emit state
         lastSeq=1                    lastSeq=3
            |                             |
            v                             v
Client:  discard(1)                  discard(1,2,3)
         replay(2,3,4,5)             replay(4,5)
```

The buffer shrinks as the server catches up. Under normal conditions (low latency), the buffer rarely exceeds 1-2 entries. Under high latency, it may hold 5-10 inputs which are replayed each reconciliation cycle.

## State Restoration

The `restoreFromState` method on `TetrisGame` overwrites all visible game state from a server snapshot:

**File:** `shared/src/TetrisGame.ts`

```typescript
restoreFromState(state: TetrisState, extraNextTypes?: TetrominoType[]): void {
  this.board = state.board.map(row => [...row])   // deep copy
  this.currentPiece = { ...state.currentPiece }
  this.nextType = state.nextPiece
  this.nextTypes = [...state.nextPieces, ...(extraNextTypes ?? [])]
  this.heldType = state.heldPiece
  this.canHold = state.canHold
  this.score = state.score
  this.lines = state.lines
  this.level = state.level
  this.gameOver = state.gameOver
  // Private state resets
  this.combo = -1
  this.backToBack = false
  this.outgoingGarbage = 0
  this.pendingGarbage = []
}
```

### Why private fields are reset to defaults

| Field | Reset Value | Reasoning |
|-------|-------------|-----------|
| `combo` | `-1` | Only affects scoring/garbage calculation. Server corrects on next line clear. |
| `backToBack` | `false` | Same as combo -- scoring only. |
| `outgoingGarbage` | `0` | Garbage sending is server-only. Client never predicts garbage sent to opponents. |
| `pendingGarbage` | `[]` | Garbage arrival timing is server-only. Client doesn't predict when garbage hits. |

These values may be momentarily wrong on the client, but since they only affect score/garbage calculations (not piece movement or board layout), the visual impact is zero. The server corrects them on the very next state broadcast.

### The `extraNextTypes` parameter

The server sends 4 extra pieces beyond the visible preview queue via `predictionPieces`. This solves a subtle problem: if the player performs multiple hard drops in rapid succession during a single round trip, the client needs to know what pieces come next. Without these extra pieces, the local `TetrisGame` would run its own random generator, which would diverge from the server's sequence.

```
Server nextTypes queue:  [T, S, Z, L, I, O, J, ...]
                          ^-----------^  ^--------^
                          visible (nextCount=3)  extra (predictionPieces=4)
                          in TetrisState         in game.state payload

Client after restoreFromState:
  nextTypes = [T, S, Z, L, I, O, J]
              merged visible + extra
```

This gives the client enough headroom for ~4 hard drops per RTT without diverging from the server's piece sequence.

## Why Tetris Is Ideal for This Pattern

Client-side prediction in most games is complex because of entity interactions (player A's movement affects player B's physics). Tetris avoids these problems entirely:

1. **No cross-player physics**: Each player's board is fully independent. Moving a piece left on board A has zero effect on board B.

2. **Deterministic inputs**: Given the same board state and the same input, `processInput()` always produces the same result. No randomness in movement/rotation.

3. **Single external mutation**: The only thing that can modify a player's board externally is garbage lines from opponents. This is kept server-authoritative (not predicted) since it involves cross-player interaction with timing constraints.

4. **Simple state**: The full game state is a 2D board + piece position + a few scalars. Cheap to snapshot and restore.

5. **Low divergence risk**: Since the client and server run identical `TetrisGame` code, predictions are correct >99% of the time. The only divergence scenarios are:
   - Garbage arrives between client prediction and server processing
   - Gravity tick fires on server between two client inputs
   - Both are corrected seamlessly on the next reconciliation

## Data Flow Diagram

```
+------------------+       game.input         +------------------+
|                  |  { action, seq: 42 }     |                  |
|     Frontend     | -----------------------> |     Backend      |
|                  |                          |                  |
|  usePrediction() |       game.state         | TetrisGame (auth)|
|  local TetrisGame| <----------------------- | lastSeq tracking |
|  input buffer    |  { players, lastSeq: 42, | predictionPieces |
|  reconciliation  |    predictionPieces }    |                  |
+------------------+                          +------------------+
        |                                              |
        | predicted state                              | authoritative
        | for local player                             | state for all
        v                                              v
+------------------+                          +------------------+
|   Render local   |                          |  Render opponent |
|   player board   |                          |  board(s)        |
+------------------+                          +------------------+
```

## File Reference

| File | Purpose |
|------|---------|
| `shared/src/TetrisGame.ts` | Game logic shared by server and client. `restoreFromState()` for reconciliation, `getPredictionPieces()` for extra queue pieces. |
| `backend/src/realtime/realtime.gateway.ts` | Server-side game loop. Tracks `lastSeq` per player, emits expanded `game.state` with prediction data. |
| `frontend/src/game/tetris/prediction.ts` | `usePrediction()` hook -- local game instance, input buffer, reconciliation logic. |
| `frontend/src/components/app/room/use-room-game.ts` | Integrates prediction into the game loop. `emitInput()` applies locally + sends to server. `game.state` handler reconciles. |
| `frontend/src/realtime/events.ts` | TypeScript types for `game.state` event (includes `lastSeq`, `predictionPieces`). |
| `frontend/src/realtime/client.ts` | TypeScript types for `game.input` event (includes `seq`). |

## Further Reading

- [Gabriel Gambetta - Client-Side Prediction and Server Reconciliation](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Valve Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [webgamedev.com - Prediction & Reconciliation](https://www.webgamedev.com/backend/prediction-reconciliation)
