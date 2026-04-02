import { Button } from '@/components/ui/button.tsx'
import { MoonIcon, SunIcon, UsersIcon } from 'lucide-react'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { userStore } from '@/store/userStore.ts'
import { useStore } from '@tanstack/react-store'
import { setFriendsOverlayIsOpen } from '@/store/friendsOverlayStore.tsx'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Theme, toggleTheme, USER_QUERY_KEYS } from '@/api/user.ts'

export const Navbar = () => {
  const profileImageId = useStore(userStore, (state) => state?.profilePictureId)
  const username = useStore(userStore, (state) => state?.username)
  const theme = useStore(userStore, (state) => state?.theme)
  const isDark = theme === 'dark'

  const queryClient = useQueryClient()

  const toggleThemeMutation = useMutation({
    mutationFn: toggleTheme,
    onSuccess: (theme: Theme) => {
      document.documentElement.classList.toggle('dark', theme === Theme.DARK)
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.USER })
    },
  })

  const toggleDarkMode = () => {
    toggleThemeMutation.mutate()
  }

  return (
    <nav className="w-full bg-card flex items-stretch px-2 h-16 justify-between shadow-sm">
      <div className="text-xl font-bold flex items-center">Transcendence</div>

      <div className="flex items-stretch mt-1 mb-3">
        <div className="flex items-stretch gap-4">
          <div className="flex items-center">
            <Button variant="ghost" onClick={toggleDarkMode}>
              {isDark ? <MoonIcon /> : <SunIcon />}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFriendsOverlayIsOpen(true)}
            >
              <UsersIcon />
            </Button>
          </div>

          <div className="flex gap-10 px-1 items-center bg-secondary clip-pixel-corners-btn cursor-pointer select-none hover:translate-y-1 active:translate-y-2 transition-all">
            <p className="ml-2 font-bold text-l">{username}</p>
            <ProfileImage profilePictureId={profileImageId} />
          </div>
        </div>
      </div>
    </nav>
  )
}
