import { useEffect, useRef, useState } from 'react'
import type { InputAction } from '@transcendence/shared'
import type { GameControls, TetrisHandlingSettings } from '@/api/user.ts'
import {
  buildKeyMap,
  normalizeHandlingSettings,
} from '@/components/app/room/room-game.ts'
import { isGameInputElement } from '@/game/keyboard.ts'

export interface TetrisInputChat {
  /** Key that toggles the chat panel open. */
  toggleChatKey: string
  /** Whether the chat panel is currently open. */
  isOpen: () => boolean
  /** Open or close the chat panel. */
  setOpen: (open: boolean) => void
}

export interface UseTetrisInputOptions {
  /** When false, no listeners are attached (e.g. socket not ready). */
  enabled?: boolean
  controls?: GameControls
  handlingSettings?: TetrisHandlingSettings
  /** Whether game-action keys should be processed (true while playing). */
  isPlaying: () => boolean
  /** Forward a player action to the game (local or remote). */
  emitInput: (action: InputAction) => void
  /** Called once the escape key has been held long enough to quit. */
  onEscapeComplete: () => void
  /** Optional chat integration (multiplayer only). */
  chat?: TetrisInputChat
}

const ESCAPE_HOLD_DURATION = 900
const ESCAPE_HOLD_ANIMATION_DELAY = 180

/**
 * Shared keyboard input handling for the Tetris game: DAS/ARR repeat timers and
 * the escape-hold-to-quit animation. Used by both solo and multiplayer modes,
 * which differ only in how inputs are emitted and how quitting is handled.
 */
export function useTetrisInput({
  enabled = true,
  controls,
  handlingSettings,
  isPlaying,
  emitInput,
  onEscapeComplete,
  chat,
}: UseTetrisInputOptions) {
  const [escapeHoldProgress, setEscapeHoldProgress] = useState(0)

  // Keep the latest callbacks in a ref so the effect only re-subscribes when
  // the control/handling configuration actually changes.
  const optionsRef = useRef({ isPlaying, emitInput, onEscapeComplete, chat })
  optionsRef.current = { isPlaying, emitInput, onEscapeComplete, chat }

  useEffect(() => {
    if (!enabled) return

    const keyMap = buildKeyMap(controls)
    const handling = normalizeHandlingSettings(handlingSettings)
    const pressedActions = new Set<InputAction>()
    const timers: Partial<
      Record<InputAction, { delay?: number; repeat?: number }>
    > = {}
    let escapeHoldStart = 0
    let escapeHoldFrame: number | null = null
    let escapeHoldTimer: number | null = null
    let escapeHoldAnimationTimer: number | null = null

    const emit = (action: InputAction) => optionsRef.current.emitInput(action)

    const clearActionTimers = (action: InputAction) => {
      const actionTimers = timers[action]
      if (actionTimers?.delay) window.clearTimeout(actionTimers.delay)
      if (actionTimers?.repeat) window.clearInterval(actionTimers.repeat)
      delete timers[action]
    }

    const clearHorizontalTimers = () => {
      clearActionTimers('left')
      clearActionTimers('right')
    }

    const cancelEscapeHold = () => {
      if (escapeHoldFrame !== null) window.cancelAnimationFrame(escapeHoldFrame)
      if (escapeHoldTimer !== null) window.clearTimeout(escapeHoldTimer)
      if (escapeHoldAnimationTimer !== null) {
        window.clearTimeout(escapeHoldAnimationTimer)
      }
      escapeHoldFrame = null
      escapeHoldTimer = null
      escapeHoldAnimationTimer = null
      escapeHoldStart = 0
      setEscapeHoldProgress(0)
    }

    const tickEscapeHold = () => {
      if (!escapeHoldStart) return
      const progress = Math.min(
        (performance.now() - escapeHoldStart) / ESCAPE_HOLD_DURATION,
        1,
      )
      setEscapeHoldProgress(progress)
      if (progress < 1) {
        escapeHoldFrame = window.requestAnimationFrame(tickEscapeHold)
      }
    }

    const startEscapeHold = () => {
      if (escapeHoldStart) return
      escapeHoldStart = performance.now()
      escapeHoldAnimationTimer = window.setTimeout(() => {
        escapeHoldAnimationTimer = null
        if (!escapeHoldStart) return
        tickEscapeHold()
      }, ESCAPE_HOLD_ANIMATION_DELAY)
      escapeHoldTimer = window.setTimeout(() => {
        setEscapeHoldProgress(1)
        optionsRef.current.onEscapeComplete()
      }, ESCAPE_HOLD_DURATION)
    }

    const startHorizontalRepeat = (action: 'left' | 'right') => {
      clearHorizontalTimers()
      const oppositeAction = action === 'left' ? 'right' : 'left'
      pressedActions.delete(oppositeAction)
      pressedActions.add(action)
      emit(action)

      timers[action] = {
        delay: window.setTimeout(() => {
          emit(action)
          timers[action] = {
            repeat: window.setInterval(
              () => emit(action),
              Math.max(handling.arr, 16),
            ),
          }
        }, handling.das + handling.dcd),
      }
    }

    const startSoftDropRepeat = () => {
      if (pressedActions.has('softDrop')) return
      pressedActions.add('softDrop')
      emit('softDrop')
      timers.softDrop = {
        repeat: window.setInterval(
          () => emit('softDrop'),
          Math.max(handling.sdf, 16),
        ),
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const chatHandler = optionsRef.current.chat

      if (e.key === 'Escape') {
        if (!e.repeat && chatHandler?.isOpen()) {
          e.preventDefault()
          chatHandler.setOpen(false)
          return
        }
        if (isGameInputElement(e.target)) return
        e.preventDefault()
        if (!e.repeat) startEscapeHold()
        return
      }

      if (isGameInputElement(e.target)) return

      if (!optionsRef.current.isPlaying()) return

      if (chatHandler && e.key === chatHandler.toggleChatKey) {
        if (!chatHandler.isOpen()) {
          e.preventDefault()
          chatHandler.setOpen(true)
        }
        return
      }

      if (chatHandler?.isOpen()) return

      const action = keyMap[e.key]
      if (!action) return

      e.preventDefault()

      if (action === 'left' || action === 'right') {
        if (!pressedActions.has(action)) startHorizontalRepeat(action)
        return
      }

      if (action === 'softDrop') {
        startSoftDropRepeat()
        return
      }

      if (!e.repeat) emit(action)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        cancelEscapeHold()
        return
      }

      const action = keyMap[e.key]
      if (!action) return

      if (action === 'left' || action === 'right' || action === 'softDrop') {
        pressedActions.delete(action)
        clearActionTimers(action)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      for (const action of Object.keys(timers) as InputAction[]) {
        clearActionTimers(action)
      }
      cancelEscapeHold()
    }
  }, [enabled, controls, handlingSettings])

  return { escapeHoldProgress }
}
