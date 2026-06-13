import { useState } from 'react'
import { createRoute, useRouter } from '@tanstack/react-router'
import { AppRoute } from '@/routes/app/layout.tsx'
import {
  useGetAchievements,
  type AchievementsResponse,
} from '@/api/achievements.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import {
  ArrowLeftIcon,
  CheckIcon,
  CrownIcon,
  GamepadIcon,
  LayersIcon,
  LockIcon,
  MedalIcon,
  StarIcon,
  SwordsIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type Stats = AchievementsResponse['stats']

type Tier = {
  id: string
  threshold: number
  dynamicThreshold?: keyof Stats
}

type CategoryDef = {
  id: string
  label: string
  statKey: keyof Stats
  Icon: LucideIcon
  unit: string
  formatStat: (v: number) => string
  tiers: Tier[]
  invertProgress?: boolean
  progressLabel?: (statValue: number, threshold: number) => string
}

const fmt = (v: number) => v.toLocaleString()
const fmtRank = (v: number) => (v === 0 ? 'Unranked' : `#${v}`)

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
    id: 'level',
    label: 'Level',
    statKey: 'level',
    Icon: TrendingUpIcon,
    unit: 'level',
    formatStat: (v) => `Lv. ${v}`,
    tiers: [
      { id: 'level_5', threshold: 5 },
      { id: 'level_10', threshold: 10 },
      { id: 'level_25', threshold: 25 },
      { id: 'level_50', threshold: 50 },
    ],
  },
  {
    id: 'rank',
    label: 'Rank',
    statKey: 'rank',
    Icon: CrownIcon,
    unit: 'rank',
    formatStat: fmtRank,
    invertProgress: true,
    progressLabel: (v, t) =>
      v === 0
        ? 'Play a match to get ranked'
        : `Currently ${fmtRank(v)} — need top ${t}`,
    tiers: [
      { id: 'rank_top10', threshold: 10 },
      { id: 'rank_top3', threshold: 3 },
      { id: 'rank_1', threshold: 1 },
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
  {
    id: 'domination',
    label: 'Domination',
    statKey: 'bestDomination',
    Icon: SwordsIcon,
    unit: 'games',
    formatStat: (v) => `${v}`,
    progressLabel: (v, t) =>
      v === 0
        ? 'Win all games against a single opponent'
        : `Best: ${v} / ${t} undefeated games`,
    tiers: [
      { id: 'domination_3', threshold: 3 },
      { id: 'domination_5', threshold: 5 },
      { id: 'domination_10', threshold: 10 },
    ],
  },
  {
    id: 'collection',
    label: 'Collection',
    statKey: 'baseUnlocked',
    Icon: MedalIcon,
    unit: 'achievements',
    formatStat: fmt,
    tiers: [
      { id: 'collector_1', threshold: 1 },
      { id: 'collector_5', threshold: 5 },
      {
        id: 'collector_all',
        threshold: 0,
        dynamicThreshold: 'totalBaseAchievements',
      },
    ],
  },
]

function resolveThreshold(tier: Tier, stats: Stats): number {
  return tier.dynamicThreshold ? stats[tier.dynamicThreshold] : tier.threshold
}

function calcProgress(
  statValue: number,
  threshold: number,
  invert?: boolean,
): number {
  if (invert)
    return threshold === 0 || statValue === 0
      ? 0
      : Math.min(threshold / statValue, 1)
  return threshold === 0 ? 1 : Math.min(statValue / threshold, 1)
}

function CategoryDetailDialog({
  category,
  data,
  open,
  onOpenChange,
}: {
  category: CategoryDef
  data: AchievementsResponse
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { achievements, stats } = data
  const unlockedIds = new Set(
    achievements.filter((a) => a.unlocked).map((a) => a.id),
  )
  const statValue = stats[category.statKey]
  const { Icon, formatStat, invertProgress, progressLabel } = category

  const currentTierIndex = category.tiers.findIndex(
    (t) => !unlockedIds.has(t.id),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20">
              <Icon className="h-4 w-4 text-violet-400" />
            </div>
            {category.label}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {category.tiers.map((tier, index) => {
            const threshold = resolveThreshold(tier, stats)
            const achievement = achievements.find((a) => a.id === tier.id)
            const unlocked = unlockedIds.has(tier.id)
            const isCurrent = index === currentTierIndex
            const progress = isCurrent
              ? calcProgress(statValue, threshold, invertProgress)
              : unlocked
                ? 1
                : 0

            return (
              <div
                key={tier.id}
                className={`rounded-lg border p-4 transition-opacity ${
                  unlocked || isCurrent ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      unlocked ? 'bg-violet-500/20' : 'bg-muted'
                    }`}
                  >
                    {unlocked ? (
                      <CheckIcon className="h-4 w-4 text-violet-400" />
                    ) : (
                      <LockIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">
                        {achievement?.label ?? tier.id}
                      </span>
                      {unlocked && (
                        <span className="shrink-0 text-xs font-medium text-violet-400 uppercase tracking-wide">
                          Unlocked
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {achievement?.description}
                    </div>

                    {isCurrent && (
                      <div className="mt-3 flex flex-col gap-1">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-violet-500 transition-all"
                            style={{ width: `${progress * 100}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {progressLabel
                            ? progressLabel(statValue, threshold)
                            : `${formatStat(invertProgress ? statValue : Math.min(statValue, threshold))} / ${formatStat(threshold)} ${category.unit}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CategoryCard({
  category,
  data,
  onClick,
}: {
  category: CategoryDef
  data: AchievementsResponse
  onClick: () => void
}) {
  const { achievements, stats } = data
  const unlockedIds = new Set(
    achievements.filter((a) => a.unlocked).map((a) => a.id),
  )
  const completedCount = category.tiers.filter((t) =>
    unlockedIds.has(t.id),
  ).length
  const currentTier = category.tiers.find((t) => !unlockedIds.has(t.id))
  const statValue = stats[category.statKey]
  const { Icon, formatStat, invertProgress, progressLabel } = category

  const currentThreshold = currentTier
    ? resolveThreshold(currentTier, stats)
    : 0
  const progress = currentTier
    ? calcProgress(statValue, currentThreshold, invertProgress)
    : 1
  const currentAchievement = currentTier
    ? achievements.find((a) => a.id === currentTier.id)
    : null

  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-4 rounded-xl border bg-card p-5 text-left transition-colors hover:bg-accent cursor-pointer"
    >
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
            <div className="text-sm font-medium">
              {currentAchievement.label}
            </div>
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
              {progressLabel
                ? progressLabel(statValue, currentThreshold)
                : `${formatStat(invertProgress ? statValue : Math.min(statValue, currentThreshold))} / ${formatStat(currentThreshold)} ${category.unit}`}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-violet-400">
          <CheckIcon className="h-4 w-4" />
          <span>All achievements unlocked!</span>
        </div>
      )}
    </button>
  )
}

function AchievementsPage() {
  const router = useRouter()
  const { data, isLoading } = useGetAchievements()
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const unlockedCount = data?.achievements.filter((a) => a.unlocked).length ?? 0
  const totalCount = data?.achievements.length ?? 0

  return (
    <ScrollArea className="h-full">
      <div className="container mx-auto flex min-h-full max-w-2xl flex-col p-6">
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
                <CategoryCard
                  key={category.id}
                  category={category}
                  data={data}
                  onClick={() => setOpenCategory(category.id)}
                />
              ))}
            </div>

            {CATEGORIES.map((category) => (
              <CategoryDetailDialog
                key={category.id}
                category={category}
                data={data}
                open={openCategory === category.id}
                onOpenChange={(open) =>
                  setOpenCategory(open ? category.id : null)
                }
              />
            ))}
          </>
        )}
      </div>
    </ScrollArea>
  )
}

export const AchievementsRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: AchievementsPage,
  path: '/achievements',
})
