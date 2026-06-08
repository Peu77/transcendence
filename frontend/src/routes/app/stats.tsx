import {
  useMyAchievements,
  useMyStats,
  type Achievement,
  type UserStats,
} from '@/api/stats.ts'
import { Button } from '@/components/ui/button.tsx'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { AppRoute } from '@/routes/app/layout.tsx'
import { createRoute, useRouter } from '@tanstack/react-router'
import { ArrowLeftIcon, LockIcon } from 'lucide-react'

const formatPlayTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

const StatTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-muted px-4 py-3 text-center">
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  </div>
)

const StatsOverview = ({ stats }: { stats: UserStats }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
    <StatTile label="Matches" value={stats.matchesPlayed.toLocaleString()} />
    <StatTile label="Wins" value={stats.matchesWon.toLocaleString()} />
    <StatTile
      label="Win Rate"
      value={`${Math.round(stats.winRate * 100)}%`}
    />
    <StatTile label="Best Score" value={stats.highestScore.toLocaleString()} />
    <StatTile
      label="Avg Score"
      value={stats.averageScore.toLocaleString()}
    />
    <StatTile label="Lines" value={stats.totalLinesCleared.toLocaleString()} />
    <StatTile
      label="Pieces"
      value={stats.totalPiecesPlaced.toLocaleString()}
    />
    <StatTile label="Best Combo" value={stats.bestCombo.toLocaleString()} />
    <StatTile
      label="Tetrises"
      value={(stats.metrics.tetrises ?? 0).toLocaleString()}
    />
    <StatTile label="Play Time" value={formatPlayTime(stats.playTimeInSeconds)} />
  </div>
)

const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
  const percent = achievement.goal
    ? Math.min(100, Math.round((achievement.progress / achievement.goal) * 100))
    : 0

  return (
    <Card
      className={`border py-4 transition-colors ${
        achievement.unlocked
          ? 'border-yellow-500/50 bg-yellow-400/5'
          : 'border-border opacity-80'
      }`}
    >
      <CardContent className="flex items-center gap-4 px-4">
        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-md text-2xl ${
            achievement.unlocked
              ? 'bg-yellow-400/20'
              : 'bg-muted grayscale'
          }`}
        >
          {achievement.unlocked ? (
            achievement.icon
          ) : (
            <LockIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold">{achievement.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {achievement.progress.toLocaleString()} /{' '}
              {achievement.goal.toLocaleString()}
            </span>
          </div>
          <p className="mb-2 truncate text-sm text-muted-foreground">
            {achievement.description}
          </p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                achievement.unlocked ? 'bg-yellow-500' : 'bg-primary/60'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const Stats = () => {
  const router = useRouter()
  const statsQuery = useMyStats()
  const achievementsQuery = useMyAchievements()

  const isPending = statsQuery.isPending || achievementsQuery.isPending
  const isError = statsQuery.isError || achievementsQuery.isError
  const unlockedCount =
    achievementsQuery.data?.filter((a) => a.unlocked).length ?? 0

  return (
    <div className="container mx-auto flex h-full min-h-0 max-w-4xl flex-col p-6">
      <div className="mb-6 flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Stats & Achievements</h1>
          <p className="text-muted-foreground">
            Your lifetime gameplay statistics
          </p>
        </div>
      </div>

      {isPending && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-12" />
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl font-semibold">Could not load stats.</p>
          <Button
            onClick={() => {
              void statsQuery.refetch()
              void achievementsQuery.refetch()
            }}
          >
            Try again
          </Button>
        </div>
      )}

      {!isPending && !isError && statsQuery.data && achievementsQuery.data && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-6 pr-4 pb-6">
            <StatsOverview stats={statsQuery.data} />

            <div>
              <h2 className="mb-3 text-xl font-bold">
                Achievements{' '}
                <span className="text-base font-normal text-muted-foreground">
                  ({unlockedCount}/{achievementsQuery.data.length})
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {achievementsQuery.data.map((achievement) => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export const StatsRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Stats,
  path: '/stats',
})
