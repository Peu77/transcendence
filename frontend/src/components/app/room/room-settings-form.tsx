import { RoomType } from '@/api/room.ts'
import { Button } from '@/components/ui/button.tsx'
import { useAppForm } from '@/hooks/form.ts'
import { roomSettingsSchema } from '@/routes/app/room.settings.ts'
import type { RoomSettingsFormProps } from './types.ts'
import { ScrollArea } from '@radix-ui/react-scroll-area'

export function RoomSettingsForm({
  room,
  isHost,
  isSaving = false,
  onSave,
}: RoomSettingsFormProps) {
  const form = useAppForm({
    validators: { onChange: roomSettingsSchema },
    defaultValues: {
      type: room.type,
    },
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
      <div className="flex flex-wrap items-center justify-end gap-3 pb-3 lg:gap-4 lg:pb-4 ticky top-0 z-100 pr-5">
        {isHost && (
          <Button
            type="submit"
            size="sm"
            disabled={form.state.isSubmitting || isSaving}
            className="max-w-full whitespace-normal text-center leading-tight sm:whitespace-nowrap"
          >
            {form.state.isSubmitting || isSaving
              ? 'Saving...'
              : 'Save Room Settings'}
          </Button>
        )}
      </div>

      <ScrollArea className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1 lg:gap-6 lg:pr-2">
        <div className="w-full min-w-[22rem] max-w-sm rounded-xl border border-border/50 bg-background/40 p-3 lg:p-4">
          <form.AppField name="type">
            {(field) => (
              <field.Select
                label="Room Type"
                disabled={!isHost}
                values={[
                  { label: 'Public', value: RoomType.PUBLIC },
                  { label: 'Private', value: RoomType.PRIVATE },
                ]}
              />
            )}
          </form.AppField>
        </div>
      </ScrollArea>
    </form>
  )
}
