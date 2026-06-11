export function playBlockPlacedSound() {
  const audio = new Audio('/sounds/game-effects/block_placed.mp3')
  audio.play().catch(() => {})
}
