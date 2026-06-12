import { GarbageCancel, PieceRandomizer, RotationSystem } from '@/api/room.ts'
import { Button } from '@/components/ui/button.tsx'
import { useAppForm } from '@/hooks/form.ts'
import { matchSettingsSchema } from '@/routes/app/room.settings.ts'
import type { MatchSettingsFormProps } from './types.ts'

const DEFAULT_MATCH_SETTINGS = {
  gravity: 0.02,
  gincrease: 0.0025,
  gmargin: 3600,
  lockDelayMs: 300,
  lockResetLimit: 15,
  rotationSystem: RotationSystem.SRS,
  hold: true,
  nextCount: 5,
  bag: PieceRandomizer.SEVEN_BAG,
  forbidInitialSZ: false,
  width: 10,
  height: 20,
  hiddenRows: 0,
  garbageTargetK: 5,
  garbage: {
    enabled: true,
    delayMs: 500,
    cancel: GarbageCancel.PARTIAL,
    holeCount: 1,
    messiness: 0,
  },
  damage: {
    table: {
      single: 0,
      double: 1,
      triple: 2,
      tetris: 4,
      tSpinMiniSingle: 0,
      tSpinMiniDouble: 1,
      tSpinSingle: 2,
      tSpinDouble: 4,
      tSpinTriple: 6,
      allClear: 10,
    },
    comboTable: [0, 0, 1, 1, 1, 2, 2, 3, 3, 4],
    backToBackBonus: 1,
    garbageCap: 8,
  },
}

export function MatchSettingsForm({
  room,
  isHost,
  isSaving = false,
  onSave,
}: MatchSettingsFormProps) {
  const form = useAppForm({
    validators: { onChange: matchSettingsSchema },
    defaultValues: room.settings,
    onSubmit: async (data) => {
      onSave(data.value)
    },
  })

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        await form.handleSubmit()
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex items-center justify-end gap-4 pb-4 sticky top-0 z-10 pr-5">
        {isHost && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => form.reset(DEFAULT_MATCH_SETTINGS)}
              disabled={form.state.isSubmitting || isSaving}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={form.state.isSubmitting || isSaving}
            >
              {form.state.isSubmitting || isSaving
                ? 'Saving...'
                : 'Save Settings'}
            </Button>
          </>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto pr-2 md:grid-cols-2 xl:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background/40 p-4">
          <h3 className="border-b border-border pb-2 text-lg font-bold">
            Core Gameplay
          </h3>
          <form.AppField name="gravity">
            {(field) => (
              <field.NumberField
                label="Gravity"
                min={0}
                max={20}
                step={0.01}
                defaultValue={0.02}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="gincrease">
            {(field) => (
              <field.NumberField
                label="Gravity Increase"
                min={0}
                max={0.5}
                step={0.0001}
                defaultValue={0.0025}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="gmargin">
            {(field) => (
              <field.Slider
                label="Gravity Margin Time (frames)"
                min={0}
                max={10000}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="lockDelayMs">
            {(field) => (
              <field.Slider
                label="Lock Delay (ms)"
                min={0}
                max={2000}
                step={50}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="lockResetLimit">
            {(field) => (
              <field.Slider
                label="Lock Reset Limit"
                min={0}
                max={30}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background/40 p-4">
          <h3 className="border-b border-border pb-2 text-lg font-bold">
            Rules & Mechanics
          </h3>
          <form.AppField name="rotationSystem">
            {(field) => (
              <field.Select
                label="Rotation System"
                disabled={!isHost}
                values={[{ label: 'SRS+180', value: RotationSystem.SRS }]}
              />
            )}
          </form.AppField>
          <form.AppField name="bag">
            {(field) => (
              <field.Select
                label="Randomizer"
                disabled={!isHost}
                values={[{ label: '7-Bag', value: PieceRandomizer.SEVEN_BAG }]}
              />
            )}
          </form.AppField>
          <form.AppField name="nextCount">
            {(field) => (
              <field.Slider
                label="Next Queue"
                min={0}
                max={6}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <div className="mt-2 flex flex-col gap-4">
            <form.AppField name="hold">
              {(field) => (
                <field.Switch label="Enable Hold" disabled={!isHost} />
              )}
            </form.AppField>
            <form.AppField name="forbidInitialSZ">
              {(field) => (
                <field.Switch label="Forbid Initial S/Z" disabled={!isHost} />
              )}
            </form.AppField>
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background/40 p-4">
          <h3 className="border-b border-border pb-2 text-lg font-bold">
            Board Size
          </h3>
          <form.AppField name="width">
            {(field) => (
              <field.Slider
                label="Width"
                min={4}
                max={20}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="height">
            {(field) => (
              <field.Slider
                label="Height"
                min={10}
                max={40}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="hiddenRows">
            {(field) => (
              <field.Slider
                label="Hidden Rows"
                min={0}
                max={20}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background/40 p-4">
          <h3 className="border-b border-border pb-2 text-lg font-bold">
            Garbage
          </h3>
          <form.AppField name="garbageTargetK">
            {(field) => (
              <field.Slider
                label="Attacks per Target"
                min={0}
                max={20}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="garbage.enabled">
            {(field) => (
              <field.Switch label="Enable Garbage" disabled={!isHost} />
            )}
          </form.AppField>
          <form.AppField name="garbage.delayMs">
            {(field) => (
              <field.Slider
                label="Garbage Delay (ms)"
                min={0}
                max={5000}
                step={100}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="garbage.cancel">
            {(field) => (
              <field.Select
                label="Garbage Canceling"
                disabled={!isHost}
                values={[
                  { label: 'Full', value: 'full' },
                  { label: 'Partial', value: 'partial' },
                  { label: 'None', value: 'none' },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="garbage.holeCount">
            {(field) => (
              <field.Slider
                label="Hole Count"
                min={1}
                max={4}
                step={1}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="garbage.messiness">
            {(field) => (
              <field.Slider
                label="Messiness"
                min={0}
                max={1}
                step={0.01}
                disabled={!isHost}
              />
            )}
          </form.AppField>
          <form.AppField name="damage.garbageCap">
            {(field) => (
              <field.Slider
                label="Garbage Cap"
                min={1}
                max={20}
                disabled={!isHost}
              />
            )}
          </form.AppField>
        </div>

        <div className="flex flex-col gap-6 rounded-xl border border-border/50 bg-background/40 p-4 md:col-span-2 xl:col-span-2">
          <h3 className="border-b border-border pb-2 text-lg font-bold">
            Damage Table
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <form.AppField name="damage.table.single">
              {(field) => (
                <field.Slider
                  label="Single"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.double">
              {(field) => (
                <field.Slider
                  label="Double"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.triple">
              {(field) => (
                <field.Slider
                  label="Triple"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tetris">
              {(field) => (
                <field.Slider
                  label="Tetris"
                  min={0}
                  max={20}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tSpinMiniSingle">
              {(field) => (
                <field.Slider
                  label="T-Spin Mini Single"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tSpinMiniDouble">
              {(field) => (
                <field.Slider
                  label="T-Spin Mini Double"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tSpinSingle">
              {(field) => (
                <field.Slider
                  label="T-Spin Single"
                  min={0}
                  max={10}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tSpinDouble">
              {(field) => (
                <field.Slider
                  label="T-Spin Double"
                  min={0}
                  max={15}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.tSpinTriple">
              {(field) => (
                <field.Slider
                  label="T-Spin Triple"
                  min={0}
                  max={20}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.table.allClear">
              {(field) => (
                <field.Slider
                  label="All Clear"
                  min={0}
                  max={20}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
            <form.AppField name="damage.backToBackBonus">
              {(field) => (
                <field.Slider
                  label="B2B Bonus"
                  min={0}
                  max={5}
                  disabled={!isHost}
                />
              )}
            </form.AppField>
          </div>
        </div>
      </div>
    </form>
  )
}
