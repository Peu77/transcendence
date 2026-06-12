import { z } from 'zod'
import { useAppForm } from '@/hooks/form.ts'
import { useMutation } from '@tanstack/react-query'
import { login, type LoginResponse } from '@/api/auth.ts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { toast } from 'sonner'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button.tsx'
import { FieldSeparator } from '@/components/ui/field.tsx'
import { GithubIcon } from 'lucide-react'
import { env } from '@/env.ts'
import { type FormEvent, useEffect, useState } from 'react'
import { verifyTwoFaLogin } from '@/api/twofa.ts'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { useGetUser } from '@/api/user.ts'
import { userStore } from '@/store/userStore.ts'

const loginSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function Login() {
  const navigate = useNavigate()
  const userQuery = useGetUser()
  const [twoFaData, setTwoFaData] = useState<LoginResponse | null>(null)
  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    if (
      !userQuery.data ||
      userQuery.error ||
      userQuery.isLoading ||
      !userQuery.data.id
    )
      return

    userStore.setState(() => userQuery.data)
    document.documentElement.classList.toggle(
      'dark',
      userQuery.data.theme === 'dark',
    )
    navigate({ to: '/app' }).catch(console.error)
  }, [navigate, userQuery.data])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const userId = params.get('userId')
    const twoFaSessionId = params.get('twoFaSessionId')

    if (userId && twoFaSessionId) {
      setTwoFaData({
        requires2FA: true,
        twoFaSession: { twoFaSessionId },
        userId,
      })
      toast.info('Two-factor authentication required for GitHub login')
      // Clear the query parameters without refreshing the page
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const form = useAppForm({
    validators: { onChange: loginSchema },
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async (data) => {
      await loginMutation.mutateAsync(data.value)
    },
  })

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data, vars) => {
      if (data.requires2FA) {
        setTwoFaData(data)
        toast.info('Two-factor authentication required')
        return
      }

      toast.success('Logged in!', {
        description: `Welcome back, ${vars.email}.`,
        duration: 3000,
      })
      await navigate({ to: '/app' })
    },
    onError: (err: any) => {
      const description =
        err?.response?.data?.error ||
        err?.message ||
        'Invalid email or password.'
      toast.error('Login failed', { description, duration: 4000 })
    },
  })

  const verifyMutation = useMutation({
    mutationFn: verifyTwoFaLogin,
    onSuccess: async () => {
      toast.success('2FA Verified! Logging in...')
      await navigate({ to: '/app' })
    },
    onError: (err: any) => {
      const description =
        err?.response?.data?.message || err?.message || 'Invalid 2FA code.'
      toast.error('2FA Verification failed', { description, duration: 4000 })
      if (description.includes('Too many attempts')) {
        setOtpCode('')
      }
    },
  })

  async function handleTwoFaSubmit(e: FormEvent) {
    e.preventDefault()
    if (!twoFaData || !twoFaData.twoFaSession || !twoFaData.userId) return

    verifyMutation.mutate({
      token: otpCode,
      twoFaSessionId: twoFaData.twoFaSession.twoFaSessionId,
      userId: twoFaData.userId,
    })
  }

  const isBusy =
    loginMutation.isPending ||
    form.state.isSubmitting ||
    verifyMutation.isPending

  if (twoFaData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Card className="animate-scale-in w-full max-w-md">
          <CardHeader>
            <CardTitle>Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTwoFaSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isBusy || otpCode.length !== 6}>
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setTwoFaData(null)
                    setOtpCode('')
                  }}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>sign in into your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              await form.handleSubmit()
            }}
            noValidate
            className="flex flex-col gap-3 w-72"
          >
            <form.AppField
              name={'email'}
              children={(field) => (
                <field.TextField label="Email" placeholder={'email'} />
              )}
            />

            <form.AppField
              name={'password'}
              children={(field) => (
                <field.TextField
                  label="Password"
                  placeholder={'password'}
                  type={'password'}
                />
              )}
            />

            <Button size={'sm'} disabled={isBusy}>
              {isBusy ? 'logging in…' : 'login'}
            </Button>

            <FieldSeparator className="mt-3 mb-3">
              Or continue with
            </FieldSeparator>

            <Button asChild className="flex gap-1" variant="secondary">
              <Link to={env.VITE_BACKEND_GITHUB_OAUTH_URL}>
                <GithubIcon size="18" />
                github
              </Link>
            </Button>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Don’t have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
