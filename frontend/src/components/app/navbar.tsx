import { useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
import {
  LogOutIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { userStore } from '@/store/userStore.ts'
import { useStore } from '@tanstack/react-store'
import { setFriendsOverlayIsOpen } from '@/store/friendsOverlayStore.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout, Theme, toggleTheme, USER_QUERY_KEYS } from '@/api/user.ts'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'
import { Link, useNavigate } from '@tanstack/react-router'
import { DropdownMenu } from 'radix-ui'
import { toast } from 'sonner'
import { useGetUnreadDirectMessages } from '@/api/friends.ts'

export const Navbar = () => {
  const [profileOpen, setProfileOpen] = useState(false)
  const profileImageId = useStore(userStore, (state) => state?.profilePictureId)
  const username = useStore(userStore, (state) => state?.username)
  const userId = useStore(userStore, (state) => state?.id)
  const theme = useStore(userStore, (state) => state?.theme)
  const isDark = theme === 'dark'
  const unreadMessagesQuery = useGetUnreadDirectMessages()
  const unreadMessageCount = unreadMessagesQuery.data?.count ?? 0

  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const toggleThemeMutation = useMutation({
    mutationFn: toggleTheme,
    onSuccess: async (theme: Theme) => {
      document.documentElement.classList.toggle('dark', theme === Theme.DARK)
      await queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER })
    },
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      userStore.setState(() => null)
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.USER })
      navigate({ to: '/' }).catch(console.error)
    },
    onError: () => {
      toast.error('Could not log out. Please try again.')
    },
  })

  const toggleDarkMode = () => {
    toggleThemeMutation.mutate()
  }

  return (
    <nav className="w-full bg-card flex items-stretch px-2 h-16 justify-between shadow-sm">
      <Link
        to={userId ? '/app' : '/'}
        className="text-xl font-bold flex items-center"
      >
        Transcendence
      </Link>

      <div className="flex items-stretch mt-1 mb-3">
        <div className="flex items-stretch gap-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={toggleDarkMode}>
              {isDark ? <MoonIcon /> : <SunIcon />}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                className="relative"
                onClick={() => setFriendsOverlayIsOpen(true)}
                aria-label={
                  unreadMessageCount > 0
                    ? `Open friends, ${unreadMessageCount} unread messages`
                    : 'Open friends'
                }
              >
                <UsersIcon />
              </Button>
              {unreadMessageCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold leading-5 text-white">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="flex gap-10 px-1 items-center bg-secondary clip-pixel-corners-btn cursor-pointer select-none hover:translate-y-1 active:translate-y-2 transition-all"
              >
                <span className="ml-2 font-bold text-l">{username}</span>
                <ProfileImage profilePictureId={profileImageId} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
              >
                <DropdownMenu.Item
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                  onSelect={() => setProfileOpen(true)}
                >
                  <UserIcon className="size-4" />
                  Profile
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-border my-1" />
                <DropdownMenu.Item
                  asChild
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                >
                  <Link to="/privacy">
                    <ShieldCheckIcon className="size-4" />
                    Privacy Policy
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  asChild
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground"
                >
                  <Link to="/terms">
                    <ShieldCheckIcon className="size-4" />
                    Terms of Service
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-border my-1" />
                <DropdownMenu.Item
                  className="flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-2 text-sm text-destructive outline-none focus:bg-accent focus:text-destructive"
                  disabled={logoutMutation.isPending}
                  onSelect={() => logoutMutation.mutate()}
                >
                  <LogOutIcon className="size-4" />
                  {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {userId && (
            <ProfileDialog
              userId={userId}
              open={profileOpen}
              onOpenChange={setProfileOpen}
            />
          )}
        </div>
      </div>
    </nav>
  )
}
