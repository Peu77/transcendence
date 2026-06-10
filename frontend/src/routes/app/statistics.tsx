import { useState } from 'react'
import {
  type GlobalRankingItem,
  type MatchHistoryItem,
  useGlobalRanking,
  useMatchHistory,
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
  ChartNoAxesColumnIncreasingIcon,
  CrownIcon,
  HistoryIcon,
  MedalIcon,
  TrophyIcon,
} from 'lucide-react'

const placementLabel = (placement: number, playerCount: number) =>
  `${placement} / ${playerCount}`

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-muted px-3 py-2 text-center">
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  </div>
)

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
          onOpenChange={(open) => {
            if (!open) setProfileUserId(null)
          }}
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
                <ProfileImage
                  profilePictureId={player.profilePictureId}
                  className="size-7 shrink-0"
                />
                <span className="truncate font-semibold">
                  {player.username}
                </span>
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

const LoadingState = () => (
  <div className="flex h-full items-center justify-center">
    <Spinner className="size-12" />
  </div>
)

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
      {rank === 1 ? <CrownIcon className="size-5" /> : rank <= 3 ? <MedalIcon className="size-5" /> : rank}
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
        onOpenChange={(open) => {
          if (!open) setProfileUserId(null)
        }}
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

const Statistics = () => {
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
          <h1 className="text-3xl font-bold">Statistics</h1>
          <p className="text-muted-foreground">
            Your match history and the global player ranking
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="history"
        className="flex min-h-0 flex-1 flex-col gap-4"
      >
        <TabsList className="grid w-full shrink-0 grid-cols-2">
          <TabsTrigger value="history">
            <HistoryIcon />
            Match History
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <ChartNoAxesColumnIncreasingIcon />
            Global Ranking
          </TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="min-h-0">
          <MatchHistory />
        </TabsContent>
        <TabsContent value="ranking" className="min-h-0">
          <GlobalRanking />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const StatisticsRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: Statistics,
  path: '/statistics',
})
