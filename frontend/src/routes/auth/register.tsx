import { z } from 'zod'
import { useAppForm } from '@/hooks/form.ts'
import { useMutation } from '@tanstack/react-query'
import { register } from '@/api/auth.ts'
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
import type { AxiosError } from 'axios'

type RegisterConflictResponse = {
  message?: string
  fieldAlreadyExists?: 'email' | 'username'
}

const registerSchema = z
  .object({
    username: z
      .string()
      .min(2, 'Username must be at least 2 characters')
      .max(8, 'Username must be at most 8 characters'),
    email: z.email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export default function Register() {
  const navigate = useNavigate()

  const form = useAppForm({
    validators: { onChange: registerSchema },
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async (data) => {
      await handleSubmit(data.value)
    },
  })

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: async (_data, vars) => {
      toast.success('Account created!', {
        description: `Welcome, ${vars.email}.`,
        duration: 3000,
      })
      await navigate({ to: '/app' })
    },
    onError: (err: AxiosError<RegisterConflictResponse>) => {
      const conflictField = err.response?.data?.fieldAlreadyExists

      if (err.response?.status === 409 && conflictField) {
        const message =
          err.response.data.message ?? `${conflictField} already registered`

        form.setFieldMeta(conflictField, (prev) => ({
          ...prev,
          isTouched: true,
          errorMap: {
            ...prev.errorMap,
            onSubmit: message,
          },
        }))

        toast.error(message, {
          description: `Please use a different ${conflictField}.`,
          duration: 4000,
        })
        return
      }
      const description = 'Could not create account.'
      toast.error('Registration failed', { description, duration: 4000 })
    },
  })

  async function handleSubmit(values: z.infer<typeof registerSchema>) {
    await registerMutation.mutateAsync({
      username: values.username,
      email: values.email,
      password: values.password,
    })
  }

  const isBusy = registerMutation.isPending || form.state.isSubmitting

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>sign up to get started</CardDescription>
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
              name={'username'}
              children={(field) => (
                <field.TextField
                  label="Username"
                  placeholder="enter username"
                  type="text"
                />
              )}
            />

            <form.AppField
              name="email"
              children={(field) => (
                <field.TextField
                  label="Email"
                  placeholder="enter email"
                  type="email"
                />
              )}
            />

            <form.AppField
              name="password"
              children={(field) => (
                <field.TextField
                  label="Password"
                  placeholder="enter password"
                  type="password"
                />
              )}
            />

            <form.AppField
              name="confirmPassword"
              children={(field) => (
                <field.TextField
                  label="Confirm password"
                  placeholder="confirm password"
                  type="password"
                />
              )}
            />

            <Button size={'sm'} disabled={isBusy}>
              {isBusy ? 'creating..' : 'create account'}
            </Button>

            <p className="text-sm text-muted-foreground mt-2 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
