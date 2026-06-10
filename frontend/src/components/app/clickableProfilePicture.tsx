import { Link } from '@tanstack/react-router'
import { ProfileImage } from '@/components/app/profileImage.tsx'

export const ClickableProfilePicture = ({
  userId,
  profilePictureId,
  size = 'md',
}: {
  userId: string
  profilePictureId: string | null
  size?: 'sm' | 'md' | 'lg'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <Link
      to="/app/profile/$userId"
      params={{ userId }}
      className={`${sizeClasses[size]} rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity block`}
    >
      <ProfileImage profilePictureId={profilePictureId} />
    </Link>
  )
}
