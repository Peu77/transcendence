import { useEffect, useState } from 'react'
import {
  DEFAULT_TETRIS_HANDLING_SETTINGS,
  type TetrisHandlingSettings,
  useUpdateTetrisHandlingSettings,
} from '@/api/user.ts'
import { Button } from '@/components/ui/button.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Slider } from '@/components/ui/slider.tsx'
import { toast } from 'sonner'

const SETTING_LABELS: Record<keyof TetrisHandlingSettings, string> = {
  arr: 'ARR',
  das: 'DAS',
  dcd: 'DCD',
  sdf: 'SDF',
}

const SETTING_DESCRIPTIONS: Record<keyof TetrisHandlingSettings, string> = {
  arr: 'Auto repeat rate in milliseconds. Lower means faster horizontal repeat while holding left or right.',
  das: 'Delayed auto shift in milliseconds before held left or right starts repeating.',
  dcd: 'DAS cut delay in milliseconds after changing horizontal direction.',
  sdf: 'Soft drop repeat speed in milliseconds while holding the soft drop key.',
}

const SETTING_KEYS = Object.keys(
  SETTING_LABELS,
) as (keyof TetrisHandlingSettings)[]

const MIN_SETTING_VALUE = 0
const MAX_SETTING_VALUE = 1000

type TetrisHandlingAccordionProps = {
  settings: TetrisHandlingSettings
}

const normalizeSettings = (
  settings: Partial<TetrisHandlingSettings>,
): TetrisHandlingSettings => ({
  ...DEFAULT_TETRIS_HANDLING_SETTINGS,
  ...settings,
})

export const TetrisHandlingAccordion = ({
  settings,
}: TetrisHandlingAccordionProps) => {
  const [draftSettings, setDraftSettings] = useState<TetrisHandlingSettings>(
    normalizeSettings(settings),
  )
  const updateSettingsMutation = useUpdateTetrisHandlingSettings()

  useEffect(() => {
    setDraftSettings(normalizeSettings(settings))
  }, [settings])

  const handleSliderChange =
    (key: keyof TetrisHandlingSettings) => (value: number[]) => {
      const [sliderValue = MAX_SETTING_VALUE] = value
      setDraftSettings((current) => ({
        ...current,
        [key]: MAX_SETTING_VALUE - sliderValue,
      }))
    }

  const handleReset = () => setDraftSettings(DEFAULT_TETRIS_HANDLING_SETTINGS)

  const handleSave = () => {
    toast.promise(updateSettingsMutation.mutateAsync(draftSettings), {
      loading: 'Saving Tetris handling...',
      success: 'Tetris handling saved',
      error: 'Failed to save Tetris handling',
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tune Tetris movement timings like tetr.io. All values are in
        milliseconds.
      </p>

      <div className="grid gap-4">
        {SETTING_KEYS.map((key) => {
          const sliderValue = MAX_SETTING_VALUE - draftSettings[key]

          return (
            <div key={key} className="grid gap-3 rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`tetris-handling-${key}`}>
                  {SETTING_LABELS[key]}
                </Label>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium">
                  {draftSettings[key]} ms
                </span>
              </div>
              <Slider
                id={`tetris-handling-${key}`}
                min={MIN_SETTING_VALUE}
                max={MAX_SETTING_VALUE}
                step={1}
                value={[sliderValue]}
                onValueChange={handleSliderChange(key)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slow</span>
                <span>Fast</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {SETTING_DESCRIPTIONS[key]}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={updateSettingsMutation.isPending}
        >
          Reset
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
        >
          Save handling
        </Button>
      </div>
    </div>
  )
}
