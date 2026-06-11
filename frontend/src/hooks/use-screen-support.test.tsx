// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MIN_SUPPORTED_SCREEN_HEIGHT,
  MIN_SUPPORTED_SCREEN_WIDTH,
  getScreenSupportStatus,
  useScreenSupport,
} from './use-screen-support.ts'

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
  })
}

const setUserAgent = (userAgent: string) => {
  Object.defineProperty(window.navigator, 'userAgent', {
    configurable: true,
    value: userAgent,
  })
}

describe('screen support detection', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    setViewport(MIN_SUPPORTED_SCREEN_WIDTH, MIN_SUPPORTED_SCREEN_HEIGHT)
  })

  it('allows a desktop viewport at the supported size', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    setViewport(MIN_SUPPORTED_SCREEN_WIDTH, MIN_SUPPORTED_SCREEN_HEIGHT)

    expect(getScreenSupportStatus()).toMatchObject({
      isSupported: true,
      isMobileDevice: false,
      isTooSmall: false,
    })
  })

  it('blocks viewports below the minimum supported size', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    setViewport(MIN_SUPPORTED_SCREEN_WIDTH - 1, MIN_SUPPORTED_SCREEN_HEIGHT)

    expect(getScreenSupportStatus()).toMatchObject({
      isSupported: false,
      isMobileDevice: false,
      isTooSmall: true,
    })
  })

  it('blocks mobile user agents even when the viewport is large enough', () => {
    setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')
    setViewport(1400, 900)

    expect(getScreenSupportStatus()).toMatchObject({
      isSupported: false,
      isMobileDevice: true,
      isTooSmall: false,
    })
  })

  it('updates when the window is resized', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')
    setViewport(1400, 900)

    const { result } = renderHook(() => useScreenSupport())

    expect(result.current.isSupported).toBe(true)

    act(() => {
      setViewport(900, 900)
      window.dispatchEvent(new Event('resize'))
    })

    expect(result.current).toMatchObject({
      isSupported: false,
      isTooSmall: true,
      width: 900,
      height: 900,
    })
  })
})
