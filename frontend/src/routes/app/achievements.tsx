import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import { useGetAchievements, type AchievementsResponse } from '@/api/achievements.ts'
import { Button } from '@/components/ui/button.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import {
  ArrowLeftIcon,
  CheckIcon,
  GamepadIcon,
  LayersIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Stats = AchievementsResponse['stats']

type Tier = { id: string; threshold: number }

type CategoryDef = {
  id: string
  label: string
  statKey: keyof Stats
  Icon: LucideIcon
  unit: string
  formatStat: (v: number) => string
  tiers: Tier[]
}

const fmt = (v: number) => v.toLocaleString()

const CATEGORIES: CategoryDef[] = [
  {
    id: 'matches',
    label: 'Matches',
    statKey: 'matches',
    Icon: GamepadIcon,
    unit: 'matches',
    formatStat: fmt,
    tiers: [
      { id: 'first_match', threshold: 1 },
      { id: 'matches_10', threshold: 10 },
      { id: 'matches_50', threshold: 50 },
      { id: 'matches_100', threshold: 100 },
    ],
  },
  {
    id: 'score',
    label: 'Score',
    statKey: 'score',
    Icon: StarIcon,
    unit: 'points',
    formatStat: fmt,
    tiers: [
      { id: 'score_1k', threshold: 1000 },
      { id: 'score_10k', threshold: 10000 },
      { id: 'score_100k', threshold: 100000 },
    ],
  },
  {
    id: 'lines',
    label: 'Lines',
    statKey: 'lines',
    Icon: LayersIcon,
    unit: 'lines',
    formatStat: fmt,
    tiers: [
      { id: 'lines_100', threshold: 100 },
      { id: 'lines_500', threshold: 500 },
      { id: 'lines_1000', threshold: 1000 },
    ],
  },
  {
    id: 'wins',
    label: 'Wins',
    statKey: 'wins',
    Icon: TrophyIcon,
    unit: 'wins',
    formatStat: fmt,
    tiers: [
      { id: 'first_win', threshold: 1 },
      { id: 'wins_10', threshold: 10 },
      { id: 'wins_50', threshold: 50 },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    statKey: 'friends',
    Icon: UsersIcon,
    unit: 'friends',
    formatStat: fmt,
    tiers: [
      { id: 'first_friend', threshold: 1 },
      { id: 'friends_5', threshold: 5 },
    ],
  },
]

function CategoryCard({
  category,
  data,
}: {
  category: CategoryDef
  data: AchievementsResponse
}) {
  const { achievements, stats } = data
  const unlockedIds = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id))
  const completedCount = category.tiers.filter((t) => unlockedIds.has(t.id)).length
  const currentTier = category.tiers.find((t) => !unlockedIds.has(t.id))
  const statValue = stats[category.statKey]
  const { Icon, formatStat } = category

  const progress = currentTier ? Math.min(statValue / currentTier.threshold, 1) : 1
  const currentAchievement = currentTier
    ? achievements.find((a) => a.id === currentTier.id)
    : null

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20">
            <Icon className="h-4 w-4 text-violet-400" />
          </div>
          <span className="font-semibold">{category.label}</span>
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
          {completedCount} / {category.tiers.length}
        </span>
      </div>

      {currentAchievement ? (
        <>
          <div>
            <div className="text-sm font-medium">{currentAchievement.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {currentAchievement.description}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-violet-500 transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {formatStat(Math.min(statValue, currentTier!.threshold))} /{' '}
              {formatStat(currentTier!.threshold)} {category.unit}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <CheckIcon className="h-4 w-4" />
          <span>All achievements unlocked!</span>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} data={data} />
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
