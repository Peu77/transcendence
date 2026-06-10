// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GameControls } from '@/api/user.ts'
import { useTetrisInput } from './use-tetris-input.ts'

const controls: GameControls = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  rotateCW: 'x',
  rotateCCW: 'z',
  rotate180: 'a',
  softDrop: 'ArrowDown',
  hardDrop: ' ',
  hold: 'c',
  toggleChat: 't',
}

describe('useTetrisInput', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ignores gameplay keys while a protected element has focus', () => {
    const emitInput = vi.fn()

    renderHook(() =>
      useTetrisInput({
        controls,
        isPlaying: () => true,
        emitInput,
        onEscapeComplete: vi.fn(),
      }),
    )

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    )

    expect(emitInput).not.toHaveBeenCalled()

    input.remove()
  })

  it('still forwards gameplay keys from the board surface', () => {
    const emitInput = vi.fn()

    renderHook(() =>
      useTetrisInput({
        controls,
        isPlaying: () => true,
        emitInput,
        onEscapeComplete: vi.fn(),
      }),
    )

    const board = document.createElement('div')
    document.body.appendChild(board)
    board.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    )

    expect(emitInput).toHaveBeenCalledWith('left')

    board.remove()
  })
})
