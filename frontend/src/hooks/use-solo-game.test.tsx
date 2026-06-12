// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { InputAction, MatchSettings } from '@transcendence/shared'
import { useSoloGame } from './use-solo-game.ts'

const navigateMock = vi.fn()
const createdSettings: Partial<MatchSettings>[] = []
const receivedGarbage: number[] = []
let emitInputFromHook: ((action: InputAction) => void) | null = null

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@tanstack/react-store', () => ({
  useStore: () => ({
    gameControls: undefined,
    tetrisHandlingSettings: undefined,
  }),
}))

vi.mock('@/store/userStore.ts', () => ({ userStore: {} }))

vi.mock('@/hooks/use-tetris-input.ts', () => ({
  useTetrisInput: (options: { emitInput: (action: InputAction) => void }) => {
    emitInputFromHook = options.emitInput
    return { escapeHoldProgress: 0 }
  },
}))

vi.mock('@transcendence/shared', () => ({
  GarbageCancel: { NONE: 'none' },
  TetrisGame: class {
    level = 1
    gameOver = false
    outgoingGarbage = 0

    constructor(settings: Partial<MatchSettings>) {
      createdSettings.push(settings)
    }

    getState() {
      return {
        board: [],
        active: null,
        ghost: null,
        hold: null,
        nextQueue: [],
        width: 10,
        height: 20,
        hiddenRows: 0,
        combo: 0,
        backToBack: false,
        lines: 0,
        level: 1,
        score: 0,
        gameOver: false,
        garbageQueue: [],
        piecesPlaced: 0,
      }
    }

    getTickInterval() {
      return 1000
    }

    tick() {
      return true
    }

    processInput() {
      this.outgoingGarbage = 4
    }

    collectOutgoingGarbage() {
      const outgoingGarbage = this.outgoingGarbage
      this.outgoingGarbage = 0
      return outgoingGarbage
    }

    receiveGarbage(lines: number) {
      receivedGarbage.push(lines)
    }
  },
}))

describe('useSoloGame', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    createdSettings.length = 0
    receivedGarbage.length = 0
    emitInputFromHook = null
    navigateMock.mockReset()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('starts solo games with the solo garbage profile and restarts on R', () => {
    renderHook(() => useSoloGame())

    expect(createdSettings).toHaveLength(1)
    expect(createdSettings[0]).toMatchObject({
      gravity: 0.02,
      garbage: { enabled: true, delayMs: 0, cancel: 'none' },
    })

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'r', bubbles: true }),
      )
    })

    expect(createdSettings).toHaveLength(2)
  })

  it('applies updated settings directly and restarts with the new rules', () => {
    const { result } = renderHook(() => useSoloGame())

    act(() => {
      result.current.updateSettings({
        gravity: 2.5,
        gincrease: 0,
        gmargin: 0,
        hold: false,
        infiniteHold: false,
        lockDelayMs: 150,
        nextCount: 3,
        forbidInitialSZ: true,
        blowbackPercent: 50,
      })
      vi.advanceTimersByTime(200)
    })

    expect(createdSettings.at(-1)).toMatchObject({
      gravity: 2.5,
      hold: false,
      lineClearDelayMs: 0,
      lockDelayMs: 150,
      nextCount: 3,
      forbidInitialSZ: true,
    })
    expect(result.current.settings.blowbackPercent).toBe(50)
  })

  it('returns the configured blowback percentage as self-garbage', () => {
    const { result } = renderHook(() => useSoloGame())

    act(() => {
      result.current.updateSettings({
        gravity: 1,
        gincrease: 0,
        gmargin: 0,
        hold: true,
        infiniteHold: false,
        lockDelayMs: 500,
        nextCount: 5,
        forbidInitialSZ: false,
        blowbackPercent: 50,
      })
      vi.advanceTimersByTime(200)
    })

    expect(emitInputFromHook).not.toBeNull()

    act(() => {
      emitInputFromHook?.('hardDrop')
    })

    expect(receivedGarbage).toEqual([2])
  })

  it('ignores the restart shortcut while typing in an input', () => {
    renderHook(() => useSoloGame())

    const input = document.createElement('input')
    document.body.appendChild(input)

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'r', bubbles: true }),
      )
    })

    expect(createdSettings).toHaveLength(1)

    input.remove()
  })
})
