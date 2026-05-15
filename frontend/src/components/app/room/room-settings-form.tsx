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
      <div className="flex items-center justify-end gap-4 pb-4">
        {isHost && (
          <Button
            type="submit"
            size="sm"
            disabled={form.state.isSubmitting || isSaving}
          >
            {form.state.isSubmitting || isSaving
              ? 'Saving...'
              : 'Save Room Settings'}
          </Button>
        )}
      </div>

      <ScrollArea className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-2">
        <div className="max-w-sm rounded-xl border border-border/50 bg-background/40 p-4">
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
