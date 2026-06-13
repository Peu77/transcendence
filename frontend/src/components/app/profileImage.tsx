import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx'
import { env } from '@/env.ts'
import DefaultProfileImage from '@/assets/defaultProfilePicture.webp'

export const ProfileImage = (props: {
  profilePictureId: string | null | undefined
  className?: string
}) => {
  const src = props.profilePictureId
    ? `${env.VITE_BACKEND_URL}/users/profilePicture/${props.profilePictureId}`
    : DefaultProfileImage

  return (
    <Avatar className={props.className}>
      <AvatarImage src={src} />
      <AvatarFallback>
        <img src={DefaultProfileImage} alt="" className="size-full" />
      </AvatarFallback>
    </Avatar>
  )
}
