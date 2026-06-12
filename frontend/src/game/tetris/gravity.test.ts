import { describe, expect, it } from 'vitest'
import { TetrisGame } from '@transcendence/shared'

describe('TetrisGame gravity overrides', () => {
  it('keeps distinct intervals for high custom gravity values', () => {
    expect(
      new TetrisGame({ gravity: 11, gincrease: 0 }).getTickInterval(),
    ).toBe(2)
    expect(
      new TetrisGame({ gravity: 20, gincrease: 0 }).getTickInterval(),
    ).toBe(1)
  })

  it('keeps the standard level curve when gravity is 1 and gincrease is off', () => {
    expect(new TetrisGame({ gravity: 1, gincrease: 0 }).getTickInterval()).toBe(
      800,
    )
  })
})
