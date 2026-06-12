import { Input } from './input'
import { cn } from '@/lib/utils'

export function NumberBadgeInput(props: React.ComponentProps<typeof Input>) {
  return (
    <input
      {...props}
      className={cn(
        'w-18 h-7 px-2 text-sm font-mono text-right',
        '!bg-muted !border !border-border !rounded',
        '!shadow-none !ring-0',
        // hide number spinners (Chrome / Safari)
        '[&::-webkit-outer-spin-button]:appearance-none',
        '[&::-webkit-inner-spin-button]:appearance-none',
        // hide spinner (Firefox)
        '[appearance:textfield]',
        props.className,
      )}
    />
  )
}

// export function NumberBadgeInput(
//   props: React.ComponentProps<typeof Input>,
// ) {
//   return (
//     <input
//       {...props}
//       className={cn(
//         'w-24 h-8 px-2 text-sm font-mono',
//         'bg-muted border border-border rounded text-right',
//         'retro-input clip-pixel-corners-btn',
//         props.className,
//       )}
//     />
//   )
// }
