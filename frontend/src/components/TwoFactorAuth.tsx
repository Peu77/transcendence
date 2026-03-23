import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button.tsx'
import { generateTwoFa, enableTwoFa, disableTwoFa } from '@/api/twofa.ts'
import type { User } from '@/api/user.ts'
import { TwoFaSetup } from '@/components/two-fa/TwoFaSetup.tsx'
import { TwoFaStatus } from '@/components/two-fa/TwoFaStatus.tsx'

interface TwoFactorAuthProps {
  user: User
}

export const TwoFactorAuth = ({ user }: TwoFactorAuthProps) => {
  const queryClient = useQueryClient()
  const [twoFaData, setTwoFaData] = useState<{
    otpauthUrl: string
    base32: string
  } | null>(null)
  const [isDisabling, setIsDisabling] = useState(false)

  const generateMutation = useMutation({
    mutationFn: generateTwoFa,
    onSuccess: (data) => {
      setTwoFaData(data)
      toast.success(
        '2FA Secret generated. Please scan the QR code or enter the secret in your authenticator app.',
      )
    },
    onError: () => {
      toast.error('Failed to generate 2FA secret')
    },
  })

  const enableMutation = useMutation({
    mutationFn: enableTwoFa,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      setTwoFaData(null)
      toast.success('2FA enabled successfully')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || error.message || 'Failed to enable 2FA'
      toast.error(
        typeof message === 'string' ? message : JSON.stringify(message),
      )
    },
  })

  const disableMutation = useMutation({
    mutationFn: disableTwoFa,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user'] })
      setIsDisabling(false)
      toast.success('2FA disabled successfully')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to disable 2FA'
      toast.error(
        typeof message === 'string' ? message : JSON.stringify(message),
      )
    },
  })

  const form = useForm({
    defaultValues: {
      code: '',
    },
    onSubmit: async ({ value }) => {
      if (isDisabling) {
        disableMutation.mutate(value.code)
      } else {
        enableMutation.mutate(value.code)
      }
    },
  })

  return (
    <section className="bg-card p-6 rounded-lg border shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Two-Factor Authentication (2FA)
      </h2>
      {user.twoFaEnabled ? (
        <TwoFaStatus
          isDisabling={isDisabling}
          setIsDisabling={setIsDisabling}
          form={form}
          isPending={disableMutation.isPending}
        />
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Enhance your account security by enabling two-factor authentication.
          </p>
          {twoFaData ? (
            <TwoFaSetup
              twoFaData={twoFaData}
              form={form}
              isPending={enableMutation.isPending}
              onCancel={() => setTwoFaData(null)}
            />
          ) : (
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? 'Generating...' : 'Enable 2FA'}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
