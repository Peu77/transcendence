import { useEffect, useState } from 'react'
import {
  DEFAULT_GAME_CONTROLS,
  type GameControlAction,
  type GameControls,
  useUpdateGameControls,
} from '@/api/user.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { cn } from '@/lib/utils.ts'
import { toast } from 'sonner'
import * as React from 'react'

const CONTROL_LABELS: Record<GameControlAction, string> = {
  left: 'Move left',
  right: 'Move right',
  rotate: 'Rotate',
  softDrop: 'Soft drop',
  hardDrop: 'Hard drop',
}

const CONTROL_ACTIONS = Object.keys(CONTROL_LABELS) as GameControlAction[]

type GameControlsAccordionProps = {
  controls: GameControls
}

const normalizeControls = (controls: GameControls): GameControls => ({
  ...DEFAULT_GAME_CONTROLS,
  ...controls,
})

const formatKey = (key: string) => {
  if (key === ' ') return 'Space'
  return key
}

export const GameControlsAccordion = ({
  controls,
}: GameControlsAccordionProps) => {
  const [draftControls, setDraftControls] = useState<GameControls>(
    normalizeControls(controls),
  )
  const [selectedControl, setSelectedControl] =
    useState<GameControlAction | null>(null)
  const updateControlsMutation = useUpdateGameControls()

  useEffect(() => {
    setDraftControls(normalizeControls(controls))
  }, [controls])

  const handleKeyDown = (action: GameControlAction) => (e: React.KeyboardEvent) => {
    e.preventDefault()
    setDraftControls((current) => ({
      ...current,
      [action]: e.key,
    }))
  }

  const handleReset = () => setDraftControls(DEFAULT_GAME_CONTROLS)

  const handleSave = () => {
    toast.promise(updateControlsMutation.mutateAsync(draftControls), {
      loading: 'Saving game controls...',
      success: 'Game controls saved',
      error: 'Failed to save game controls',
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click a field and press the key you want to use in game.
      </p>

      <div className="grid gap-4">
        {CONTROL_ACTIONS.map((action) => {
          const isSelected = selectedControl === action

          return (
            <div
              key={action}
              className={cn(
                'grid gap-2 rounded-lg border border-transparent p-3 transition-colors',
                isSelected && 'border-primary/60 bg-primary/10',
              )}
            >
              <Label
                htmlFor={`control-${action}`}
                className={cn(isSelected && 'text-primary')}
              >
                {CONTROL_LABELS[action]}
              </Label>
              <Input
                id={`control-${action}`}
                value={formatKey(draftControls[action])}
                onKeyDown={handleKeyDown(action)}
                onFocus={() => setSelectedControl(action)}
                onBlur={() => setSelectedControl(null)}
                onChange={() => undefined}
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected &&
                    'border-primary bg-primary/10 text-primary shadow-sm ring-2 ring-primary/30',
                )}
                readOnly
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={updateControlsMutation.isPending}
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateControlsMutation.isPending}
        >
          Save controls
        </Button>
      </div>
    </div>
  )
}