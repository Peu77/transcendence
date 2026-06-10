import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetAchievements, type Achievement } from '@/api/achievements.ts'
import { Button } from '@/components/ui/button.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { ArrowLeftIcon, LockIcon, TrophyIcon } from 'lucide-react'

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-opacity ${
        achievement.unlocked ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
          achievement.unlocked ? 'bg-violet-500/20' : 'bg-muted'
        }`}
      >
        {achievement.unlocked ? (
          <TrophyIcon className="h-6 w-6 text-violet-400" />
        ) : (
          <LockIcon className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{achievement.label}</div>
        <div className="text-sm text-muted-foreground">
          {achievement.description}
        </div>
      </div>
      {achievement.unlocked && (
        <div className="shrink-0 text-xs font-medium text-violet-400 uppercase tracking-wide">
          Unlocked
        </div>
      )}
    </div>
  )
}

function AchievementsPage() {
  const router = useRouter()
  const { data, isLoading } = useGetAchievements()

  const unlockedCount = data?.achievements.filter((a) => a.unlocked).length ?? 0
  const totalCount = data?.achievements.length ?? 0

  return (
    <div className="container mx-auto flex h-full max-w-2xl flex-col p-6">
      <div className="mb-8 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-3xl font-bold">Achievements</h1>
      </div>

      {isLoading || !data ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-8" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between rounded-lg border bg-violet-500/10 px-5 py-4">
            <span className="text-sm text-muted-foreground">
              {unlockedCount} of {totalCount} unlocked
            </span>
            <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{
                  width: `${totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {data.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const AchievementsRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: AchievementsPage,
  path: '/achievements',
})
