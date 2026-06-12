import { useCallback, useEffect, useRef } from 'react'

const SONGS = [
  '/sounds/game-music/song1.mp3',
  '/sounds/game-music/song2.mp3',
  '/sounds/game-music/song3.mp3',
  '/sounds/game-music/song4.mp3',
  '/sounds/game-music/song5.mp3',
  '/sounds/game-music/song6.mp3',
]

function pickRandom(exclude?: string): string {
  const pool = exclude ? SONGS.filter((s) => s !== exclude) : SONGS
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useGameMusic(playing: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentSrcRef = useRef<string | undefined>(undefined)
  const playNextRef = useRef<() => void>(() => {})

  playNextRef.current = () => {
    const src = pickRandom(currentSrcRef.current)
    currentSrcRef.current = src

    if (!audioRef.current) {
      const audio = new Audio(src)
      audio.addEventListener('ended', () => playNextRef.current())
      audioRef.current = audio
    } else {
      audioRef.current.src = src
    }

    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  const playNext = useCallback(() => playNextRef.current(), [])

  useEffect(() => {
    if (playing) {
      playNext()
    } else {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [playing, playNext])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [])
}
