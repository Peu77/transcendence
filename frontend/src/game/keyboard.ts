export const RESTART_SOLO_KEY = 'r'

export const isGameInputElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return (
    target.isContentEditable ||
    target.closest('[data-prevent-game-input="true"]') !== null ||
    ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)
  )
}
