import { useState } from 'react'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'

export const ClickableProfilePicture = ({
  userId,
  profilePictureId,
  size = 'md',
}: {
  userId: string
  profilePictureId: string | null
  size?: 'sm' | 'md' | 'lg'
}) => {
  const [dialogOpen, setDialogOpen] = useState(false)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <>
      <button
        onClick={() => setDialogOpen(true)}
        className={`${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <ProfileImage profilePictureId={profilePictureId} />
      </button>
      <ProfileDialog
        userId={userId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}