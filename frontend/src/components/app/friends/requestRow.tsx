import { ProfileImage } from '@/components/app/profileImage.tsx'

export const RequestRow = (props: {
  label: string
  user: { id: string; username: string; profilePictureId: string | null }
  actions: React.ReactNode
}) => {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-sidebar-border/60">
      <div className="flex items-center gap-2 min-w-0">
        <ProfileImage profilePictureId={props.user.profilePictureId} />
        <div className="min-w-0">
          <div className="font-medium truncate">{props.user.username}</div>
          <div className="text-xs text-muted-foreground">{props.label}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">{props.actions}</div>
    </div>
  )
}
