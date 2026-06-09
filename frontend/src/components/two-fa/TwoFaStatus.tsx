import { z } from 'zod'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { ErrorMessages } from '@/components/formComponents.tsx'

interface TwoFaStatusProps {
  isDisabling: boolean
  setIsDisabling: (value: boolean) => void
  form: any
  isPending: boolean
}

export const TwoFaStatus = ({
  isDisabling,
  setIsDisabling,
  form,
  isPending,
}: TwoFaStatusProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <span className="size-2 bg-green-600 rounded-full animate-pulse" />
        2FA is currently enabled on your account.
      </div>
      {isDisabling ? (
        <div className="space-y-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            To disable 2FA, please enter the 6-digit code from your
            authenticator app.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field
              name="code"
              validators={{
                onChange: z.string().length(6, 'OTP code must be 6 digits'),
              }}
            >
              {(field: any) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Verification Code</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    autoFocus
                  />
                  <ErrorMessages errors={field.state.meta.errors} />
                </div>
              )}
            </form.Field>

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="destructive"
                disabled={isPending || form.state.isSubmitting}
              >
                {isPending ? 'Disabling...' : 'Verify and Disable'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDisabling(false)
                  form.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <Button variant="destructive" onClick={() => setIsDisabling(true)}>
          Disable 2FA
        </Button>
      )}
    </div>
  )
}
