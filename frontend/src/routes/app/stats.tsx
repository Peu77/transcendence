import { useState } from 'react'
import {
  useMyAchievements,
  useMyStats,
  type Achievement,
  type UserStats,
} from '@/api/stats.ts'
import {
  useGlobalRanking,
  useMatchHistory,
  type GlobalRankingItem,
  type MatchHistoryItem,
} from '@/api/history.ts'
import { ProfileImage } from '@/components/app/profileImage.tsx'
import { ProfileDialog } from '@/components/app/profileDialog.tsx'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.tsx'
import { AppRoute } from '@/routes/app/layout.tsx'
import { createRoute, useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
import {
  ArrowLeftIcon,
  AwardIcon,
  ChartNoAxesColumnIncreasingIcon,
  GaugeIcon,
  HistoryIcon,
  LockIcon,
  MedalIcon,
  TrophyIcon,
} from 'lucide-react'

const placementLabel = (placement: number, playerCount: number) =>
  `${placement} / ${playerCount}`

const formatPlayTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${seconds}s`
}

const LoadingState = () => (
  <div className="flex h-full items-center justify-center">
    <Spinner className="size-12" />
  </div>
)

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-muted px-3 py-2 text-center">
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  </div>
)

/* ----------------------------- Overview tab ----------------------------- */

const StatsOverview = ({ stats }: { stats: UserStats }) => (
  <ScrollArea className="h-full">
    <div className="grid grid-cols-2 gap-3 pr-4 pb-6 sm:grid-cols-3 md:grid-cols-4">
      <Stat label="Matches" value={stats.matchesPlayed.toLocaleString()} />
      <Stat label="Wins" value={stats.matchesWon.toLocaleString()} />
      <Stat label="Win Rate" value={`${Math.round(stats.winRate * 100)}%`} />
      <Stat label="Best Score" value={stats.highestScore.toLocaleString()} />
      <Stat label="Avg Score" value={stats.averageScore.toLocaleString()} />
      <Stat label="Lines" value={stats.totalLinesCleared.toLocaleString()} />
      <Stat label="Pieces" value={stats.totalPiecesPlaced.toLocaleString()} />
      <Stat label="Best Combo" value={stats.bestCombo.toLocaleString()} />
      <Stat
        label="Tetrises"
        value={(stats.metrics.tetrises ?? 0).toLocaleString()}
      />
      <Stat label="Play Time" value={formatPlayTime(stats.playTimeInSeconds)} />
    </div>
  </ScrollArea>
)

const Overview = () => {
  const statsQuery = useMyStats()

  if (statsQuery.isPending) return <LoadingState />

  if (statsQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold">Could not load your stats.</p>
        <Button onClick={() => statsQuery.refetch()}>Try again</Button>
      </div>
    )
  }

  return <StatsOverview stats={statsQuery.data} />
}

/* --------------------------- Achievements tab --------------------------- */

const formatAchievementValue = (value: number, unit: Achievement['unit']) =>
  unit === 'minutes'
    ? `${Math.floor(value / 60).toLocaleString()}m`
    : value.toLocaleString()

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
            achievement.unlocked ? 'bg-yellow-400/20' : 'bg-muted grayscale'
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
              {formatAchievementValue(achievement.progress, achievement.unit)} /{' '}
              {formatAchievementValue(achievement.goal, achievement.unit)}
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

const Achievements = () => {
  const achievementsQuery = useMyAchievements()

  if (achievementsQuery.isPending) return <LoadingState />

  if (achievementsQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold">Could not load achievements.</p>
        <Button onClick={() => achievementsQuery.refetch()}>Try again</Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 gap-3 pr-4 pb-6 md:grid-cols-2">
        {achievementsQuery.data.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </ScrollArea>
  )
}

/* ----------------------------- History tab ------------------------------ */

const MatchCard = ({ match }: { match: MatchHistoryItem }) => {
  const won = match.placement === 1
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  return (
    <Card className="gap-4 border border-border py-5">
      <CardHeader className="grid-cols-[1fr_auto] px-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex size-11 items-center justify-center rounded-md ${
              won
                ? 'bg-yellow-400/20 text-yellow-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <TrophyIcon className="size-6" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {won ? 'Victory' : `Placed ${match.placement}`}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(new Date(match.playedAt), 'PPp')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {placementLabel(match.placement, match.playerCount)}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            placement
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Stat label="Score" value={match.score.toLocaleString()} />
          <Stat label="Lines" value={match.lines.toString()} />
          <Stat label="Level" value={match.level.toString()} />
        </div>

        <ProfileDialog
          userId={profileUserId ?? ''}
          open={profileUserId !== null}
          onOpenChange={(open) => { if (!open) setProfileUserId(null) }}
        />
        <div className="overflow-hidden rounded-md border border-border">
          {match.players.map((player) => (
            <div
              key={player.userId}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-border px-4 py-2 last:border-b-0"
            >
              <span className="font-bold text-muted-foreground">
                #{player.placement}
              </span>
              <button
                onClick={() => setProfileUserId(player.userId)}
                className="flex items-center gap-2 min-w-0 text-left hover:opacity-70 transition-opacity cursor-pointer"
              >
                <ProfileImage profilePictureId={player.profilePictureId} className="size-7 shrink-0" />
                <span className="truncate font-semibold">{player.username}</span>
              </button>
              <span className="text-sm text-muted-foreground">
                {player.score.toLocaleString()} pts
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

const MatchHistory = () => {
  const historyQuery = useMatchHistory()

  if (historyQuery.isPending) return <LoadingState />

  if (historyQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold">Could not load match history.</p>
        <Button onClick={() => historyQuery.refetch()}>Try again</Button>
      </div>
    )
  }

  if (historyQuery.data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <TrophyIcon className="size-12 text-muted-foreground" />
        <p className="text-xl font-semibold">No matches recorded yet</p>
        <p className="text-muted-foreground">
          Completed multiplayer matches will appear here.
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 pr-4 pb-6">
        {historyQuery.data.map((match) => (
          <MatchCard key={match.matchId} match={match} />
        ))}
      </div>
    </ScrollArea>
  )
}

/* ----------------------------- Ranking tab ------------------------------ */

const rankClassName = (rank: number) => {
  if (rank === 1) return 'bg-yellow-400/20 text-yellow-500'
  if (rank === 2) return 'bg-slate-400/20 text-slate-500'
  if (rank === 3) return 'bg-amber-600/20 text-amber-600'
  return 'bg-muted text-muted-foreground'
}

const RankingRow = ({
  player,
  rank,
  onPlayerClick,
}: {
  player: GlobalRankingItem
  rank: number
  onPlayerClick: () => void
}) => (
  <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
    <div
      className={`flex size-9 items-center justify-center rounded-md font-bold ${rankClassName(rank)}`}
    >
      {rank <= 3 ? <MedalIcon className="size-5" /> : rank}
    </div>
    <button
      onClick={onPlayerClick}
      className="flex min-w-0 items-center gap-3 text-left hover:opacity-70 transition-opacity cursor-pointer"
    >
      <ProfileImage
        profilePictureId={player.profilePictureId}
        className="size-10 shrink-0"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold">{player.username}</p>
        <p className="text-sm text-muted-foreground">
          {player.matchesPlayed.toLocaleString()}{' '}
          {player.matchesPlayed === 1 ? 'match' : 'matches'}
        </p>
      </div>
    </button>
    <div className="text-right">
      <p className="text-lg font-bold">{player.score.toLocaleString()}</p>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        points
      </p>
    </div>
  </div>
)

const GlobalRanking = () => {
  const rankingQuery = useGlobalRanking()
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  if (rankingQuery.isPending) return <LoadingState />

  if (rankingQuery.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <p className="text-xl font-semibold">Could not load global ranking.</p>
        <Button onClick={() => rankingQuery.refetch()}>Try again</Button>
      </div>
    )
  }

  if (rankingQuery.data.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <ChartNoAxesColumnIncreasingIcon className="size-12 text-muted-foreground" />
        <p className="text-xl font-semibold">No ranking data yet</p>
        <p className="text-muted-foreground">
          Players will appear after completing multiplayer matches.
        </p>
      </div>
    )
  }

  return (
    <>
      <ProfileDialog
        userId={profileUserId ?? ''}
        open={profileUserId !== null}
        onOpenChange={(open) => { if (!open) setProfileUserId(null) }}
      />
      <ScrollArea className="h-full">
        <Card className="gap-0 overflow-hidden border border-border py-0">
          {rankingQuery.data.map((player, index) => (
            <RankingRow
              key={player.userId}
              player={player}
              rank={index + 1}
              onPlayerClick={() => setProfileUserId(player.userId)}
            />
          ))}
        </Card>
      </ScrollArea>
    </>
  )
}

/* -------------------------------- Page ---------------------------------- */

const Stats = () => {
  const router = useRouter()

  return (
    <div className="container mx-auto flex h-full min-h-0 max-w-4xl flex-col p-6">
      <div className="mb-4 flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.history.back()}
        >
          <ArrowLeftIcon />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Stats</h1>
          <p className="text-muted-foreground">
            Your stats, achievements, match history and the global ranking
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <TabsList className="grid w-full shrink-0 grid-cols-4">
          <TabsTrigger value="overview">
            <GaugeIcon />
            Overview
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <AwardIcon />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <ChartNoAxesColumnIncreasingIcon />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="min-h-0">
          <Overview />
        </TabsContent>
        <TabsContent value="achievements" className="min-h-0">
          <Achievements />
        </TabsContent>
        <TabsContent value="ranking" className="min-h-0">
          <GlobalRanking />
        </TabsContent>
        <TabsContent value="history" className="min-h-0">
          <MatchHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const StatsRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Stats,
  path: '/stats',
})
