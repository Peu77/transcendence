import { useEffect, useRef, useState } from 'react'
import {
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card.tsx'
import { Label } from '@/components/ui/label.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Slider } from '@/components/ui/slider.tsx'
import { Switch } from '@/components/ui/switch.tsx'
import { DEFAULT_SOLO_MATCH_SETTINGS, type SoloMatchSettings } from '@/game/solo-settings.ts'
import { RESTART_SOLO_KEY } from '@/game/keyboard.ts'
import { NumberBadgeInput } from '@/components/ui/number-badge-input'
import { Button } from '@/components/ui/button.tsx'

type SoloSettingsPanelProps = {
  settings: SoloMatchSettings
  onChange: (settings: SoloMatchSettings) => void
  onRestart: () => void
}

type NumericSettingKey =
  | 'gravity'
  | 'gincrease'
  | 'gmargin'
  | 'lockDelayMs'

  | 'nextCount'
  | 'blowbackPercent'

type NumericSetting = {
  key: NumericSettingKey
  label: string
  description: string
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  useInput?: boolean
  defaultValue?: number
}

const NUMERIC_SETTINGS: NumericSetting[] = [
  {
    key: 'gravity',
    label: 'Gravity',
    description:
      'Starting gravity (how fast pieces fall). Higher is faster.',
    min: 0,
    max: 3,
    step: 0.01,
    formatValue: (value) => `${value}`,
    useInput: true,
    defaultValue: 0.02,
  },
  {
    key: 'gincrease',
    label: 'Gravity increase',
    description:
      'Amount of gravity increase per second. Set to 0 to keep gravity constant throughout the run.',
    min: 0,
    max: 0.5,
    step: 0.001,
    formatValue: (value) => `${value}`,
    useInput: true,
    defaultValue: 0.0025,
  },
  {
    key: 'gmargin',
    label: 'Gravity margin',
    description:
      'Amount of time in frames until the gravity starts to increase.',
    min: 0,
    max: 7200,
    step: 60,
    formatValue: (value) => `${value}`,
  },
  {
    key: 'lockDelayMs',
    label: 'Lock delay',
    description:
      'How long a grounded piece can still be adjusted before it locks.',
    min: 0,
    max: 1500,
    step: 50,
    formatValue: (value) => `${value} ms`,
  },
  {
    key: 'nextCount',
    label: 'Preview queue',
    description:
      'How many upcoming pieces stay visible on the right side of the board.',
    min: 0,
    max: 8,
    step: 1,
    formatValue: (value) => `${value} piece${value === 1 ? '' : 's'}`,
  },
  {
    key: 'blowbackPercent',
    label: 'Blowback return',
    description:
      'How much of every attack comes back to your own board as self-garbage. A Tetris sends 4 lines, so 50% returns 2.',
    min: 0,
    max: 100,
    step: 5,
    formatValue: (value) => `${value}%`,
  },
]

function stepDecimals(step: number) {
  return (String(step).split('.')[1] ?? '').length
}

function NumericSettingInput({
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  defaultValue?: number
  onChange: (val: number) => void
}) {
  const [display, setDisplay] = useState(() => String(value))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setDisplay(String(value))
  }, [value])

  return (
    <NumberBadgeInput
      type="text"
      inputMode="decimal"
      value={display}
      className="w-20 h-7 px-2 text-xs"
      onFocus={() => { focusedRef.current = true }}
      onBlur={() => {
        focusedRef.current = false
        const parsed = parseFloat(display.replace(',', '.'))
        if (isNaN(parsed) || display.trim() === '') {
          const fallback = defaultValue ?? value
          setDisplay(String(fallback))
          onChange(fallback)
        } else {
          setDisplay(String(parsed))
        }
      }}
      onChange={(e) => {
        const raw = e.target.value
        setDisplay(raw)
        if (raw === '' || raw === '.' || raw === '-' || raw === '-.') return
        const parsed = parseFloat(raw.replace(',', '.'))
        if (!isNaN(parsed)) onChange(parsed)
      }}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
        e.preventDefault()
        const dec = stepDecimals(step)
        const raw = e.key === 'ArrowUp' ? value + step : value - step
        const next = parseFloat(Math.max(min, Math.min(max, raw)).toFixed(dec))
        onChange(next)
        setDisplay(String(next))
      }}
    />
  )
}

export function SoloSettingsPanel({
  settings,
  onChange,
}: SoloSettingsPanelProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 z-20 flex items-center pr-3">
      <aside
        data-prevent-game-input="true"
        className="group pointer-events-auto h-[calc(100%-1.5rem)] w-20 overflow-hidden transition-[width] duration-200 ease-out hover:w-104 focus-within:w-104"
      >
        <div
          data-slot="card"
          className="flex h-full w-full flex-col overflow-hidden border border-border/80 bg-card/95 text-card-foreground shadow-2xl backdrop-blur-sm clip-pixel-corners-btn supports-backdrop-filter:bg-card/90"
        >
          <div className="flex min-h-0 flex-1">
            <div className="flex w-20 shrink-0 flex-col items-center justify-between border-r border-border/70 bg-muted/35 px-3 py-4 text-center">
              <div className="space-y-3">
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground [writing-mode:vertical-rl] rotate-180">
                  settings
                </div>
              </div>
            </div>

            <div className="min-w-0 flex flex-1 flex-col opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <CardHeader className="border-b border-border/70 pb-4">
                <CardDescription>
                  Changes apply directly and restart the run automatically.
                  Press {RESTART_SOLO_KEY.toUpperCase()} anytime for a manual
                  reset.
                </CardDescription>
              </CardHeader>

              <ScrollArea className="h-0 min-h-0 flex-1">
                <CardContent className="flex flex-col gap-4 py-4 pr-6">
                  {NUMERIC_SETTINGS.map((setting) => (
                    <div
                      key={setting.key}
                      className="space-y-3 border border-border/70 bg-muted/35 p-4 clip-pixel-corners-btn"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Label className="text-sm font-medium text-foreground">
                          {setting.label}
                        </Label>
                        {setting.useInput ? (
                          <NumericSettingInput
                            value={settings[setting.key]}
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            defaultValue={setting.defaultValue}
                            onChange={(val) => onChange({ ...settings, [setting.key]: val })}
                          />
                        ) : (
                          <span className="clip-pixel-corners-btn bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
                            {setting.formatValue(settings[setting.key])}
                          </span>
                        )}
                      </div>
                      {!setting.useInput && (
                        <Slider
                          min={setting.min}
                          max={setting.max}
                          step={setting.step}
                          value={[settings[setting.key]]}
                          onValueChange={(value) => {
                            const nextValue = value[0]
                            if (nextValue === undefined) return
                            onChange({ ...settings, [setting.key]: nextValue })
                          }}
                        />
                      )}
                      <p className="text-xs leading-5 text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                  ))}

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4 border border-border/70 bg-muted/35 p-4 clip-pixel-corners-btn">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-foreground">
                          Hold queue
                        </Label>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Let yourself stash one piece for later.
                        </p>
                      </div>
                      <Switch
                        checked={settings.hold}
                        onCheckedChange={(hold) => {
                          onChange({ ...settings, hold })
                        }}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 border border-border/70 bg-muted/35 p-4 clip-pixel-corners-btn">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-foreground">
                          Forbid opening S/Z
                        </Label>
                        <p className="text-xs leading-5 text-muted-foreground">
                          Prevent the first spawned piece from being S or Z.
                        </p>
                      </div>
                      <Switch
                        checked={settings.forbidInitialSZ}
                        onCheckedChange={(forbidInitialSZ) => {
                          onChange({ ...settings, forbidInitialSZ })
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => onChange(DEFAULT_SOLO_MATCH_SETTINGS)}
                  >
                    Reset
                  </Button>
                </CardContent>
              </ScrollArea>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
