import { TwoFactorAuth } from '@/components/TwoFactorAuth.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Label } from '@/components/ui/label.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Button } from '@/components/ui/button.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { CameraIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { changeEmail, changePassword, type User } from '@/api/user.ts'

type UserSettingsAccordionProps = {
  user: User
  isUploading: boolean
  onUpload: (file: File) => Promise<unknown>
}

export const UserSettingsAccordion = ({
  user,
  isUploading,
  onUpload,
}: UserSettingsAccordionProps) => {
  const queryClient = useQueryClient()

  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [emailError, setEmailError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const emailMutation = useMutation({
    mutationFn: () => changeEmail(emailForm.newEmail, emailForm.currentPassword),
    onSuccess: () => {
      toast.success('Email updated successfully')
      setEmailForm({ newEmail: '', currentPassword: '' })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update email'),
  })

  const passwordMutation = useMutation({
    mutationFn: () => changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    onSuccess: () => {
      toast.success('Password updated successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update password'),
  })
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 400
          const MAX_HEIGHT = 400
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(
                  new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  }),
                )
              } else {
                reject(new Error('Canvas to Blob failed'))
              }
            },
            'image/jpeg',
            0.8,
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    toast.promise(
      async () => {
        const compressedFile = await compressImage(file)
        await onUpload(compressedFile)
      },
      {
        loading: 'Uploading image...',
        success: 'Image uploaded successfully',
        error: 'Failed to upload image',
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Image will get compressed</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted">
              <ProfileImage
                profilePictureId={user.profilePictureId}
                className="size-full"
              />
            </div>
            <Label
              htmlFor="avatar-upload"
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
            >
              {isUploading ? (
                <Loader2Icon className="w-8 h-8 animate-spin" />
              ) : (
                <CameraIcon className="w-8 h-8" />
              )}
            </Label>
            <input
              id="avatar-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {user.userType === 'email' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Change Email</CardTitle>
              <CardDescription>Current email: {user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.newEmail)) {
                    setEmailError('Please enter a valid email address')
                    return
                  }
                  setEmailError('')
                  emailMutation.mutate()
                }}
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="new-email">New email</Label>
                  <Input
                    id="new-email"
                    type="text"
                    value={emailForm.newEmail}
                    onChange={(e) => {
                      setEmailForm((f) => ({ ...f, newEmail: e.target.value }))
                      setEmailError('')
                    }}
                    required
                  />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="email-current-password">Current password</Label>
                  <Input
                    id="email-current-password"
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={emailMutation.isPending} className="self-end">
                  {emailMutation.isPending ? 'Saving…' : 'Update email'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast.error('Passwords do not match')
                    return
                  }
                  passwordMutation.mutate()
                }}
              >
                <div className="flex flex-col gap-1">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                    minLength={8}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <Button type="submit" disabled={passwordMutation.isPending} className="self-end">
                  {passwordMutation.isPending ? 'Saving…' : 'Update password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <TwoFactorAuth user={user} />
    </div>
  )
}
