import { TwoFactorAuth } from '@/components/TwoFactorAuth.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Label } from '@/components/ui/label.tsx'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { CameraIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import type { User } from '@/api/user.ts'

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

      <TwoFactorAuth user={user} />
    </div>
  )
}
