import { useEffect, useState } from 'react'

export const MIN_SUPPORTED_SCREEN_WIDTH = 1024
export const MIN_SUPPORTED_SCREEN_HEIGHT = 700

const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i

export type ScreenSupportStatus = {
  isSupported: boolean
  isMobileDevice: boolean
  isTooSmall: boolean
  width: number
  height: number
}

const getViewportSize = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export const getScreenSupportStatus = (): ScreenSupportStatus => {
  const { width, height } = getViewportSize()
  const userAgent =
    typeof navigator === 'undefined' ? '' : navigator.userAgent ?? ''
  const isMobileDevice = MOBILE_USER_AGENT_PATTERN.test(userAgent)
  const isTooSmall =
    width < MIN_SUPPORTED_SCREEN_WIDTH || height < MIN_SUPPORTED_SCREEN_HEIGHT

  return {
    isSupported: !isMobileDevice && !isTooSmall,
    isMobileDevice,
    isTooSmall,
    width,
    height,
  }
}

export function useScreenSupport() {
  const [status, setStatus] = useState(getScreenSupportStatus)

  useEffect(() => {
    const updateStatus = () => setStatus(getScreenSupportStatus())

    updateStatus()
    window.addEventListener('resize', updateStatus)
    window.addEventListener('orientationchange', updateStatus)

    return () => {
      window.removeEventListener('resize', updateStatus)
      window.removeEventListener('orientationchange', updateStatus)
    }
  }, [])

  return status
}
