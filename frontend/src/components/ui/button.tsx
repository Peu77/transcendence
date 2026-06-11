import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'
import {
  buttonVariants,
  type ButtonVariants,
} from '@/components/ui/button-variants'

let clickSound: HTMLAudioElement | null = null
function getClickSound() {
  if (!clickSound && typeof window !== 'undefined') {
    clickSound = new Audio('/sounds/button_click.mp3')
  }
  return clickSound
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  silent = false,
  onClick,
  ...props
}: React.ComponentProps<'button'> &
  ButtonVariants & {
    asChild?: boolean
    silent?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!silent) {
        const sound = getClickSound()
        if (sound) {
          sound.currentTime = 0
          sound.play().catch(() => {})
        }
      }
      onClick?.(e)
    },
    [onClick, silent],
  )

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Button }
