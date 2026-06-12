import type { Friend } from '@/api/friends.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { PresencePill } from '@/components/app/friends/presencePill.tsx'
import type { MouseEvent } from 'react'

export const FriendRow = (props: {
  friend: Friend
  unreadCount: number
  onOpenDM: () => void
  onOpenProfile: () => void
}) => {
  const { friend } = props
  const openProfile = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    props.onOpenProfile()
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={props.onOpenDM}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        props.onOpenDM()
      }}
      aria-label={`Open chat with ${friend.username}`}
      className="flex w-full cursor-pointer items-center gap-3 border-b border-sidebar-border/60 px-2 py-3 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <button
        type="button"
        aria-label={`Open ${friend.username}'s profile`}
        onClick={openProfile}
        className="size-10 shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ProfileImage
          profilePictureId={friend.profilePictureId}
          className="size-10"
        />
      </button>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={openProfile}
          className="block w-fit max-w-full truncate font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {friend.username}
        </button>
        <PresencePill friend={friend} />
      </div>
      {props.unreadCount > 0 && (
        <span
          className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-5 text-white"
          aria-label={`${props.unreadCount} unread messages`}
        >
          {props.unreadCount > 9 ? '9+' : props.unreadCount}
        </span>
      )}
    </div>
  )
}
