import { useMatchHistory, type MatchHistoryItem } from '@/api/history.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { ScrollArea } from '@/components/ui/scroll-area.tsx'
import { Spinner } from '@/components/ui/spinner.tsx'
import { AppRoute } from '@/routes/app/layout.tsx'
import { createRoute, useRouter } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeftIcon, TrophyIcon } from 'lucide-react'

const placementLabel = (placement: number, playerCount: number) =>
  `${placement} / ${playerCount}`

const MatchCard = ({ match }: { match: MatchHistoryItem }) => {
  const won = match.placement === 1

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

        <div className="overflow-hidden rounded-md border border-border">
          {match.players.map((player) => (
            <div
              key={player.userId}
              className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-border px-4 py-2 last:border-b-0"
            >
              <span className="font-bold text-muted-foreground">
                #{player.placement}
              </span>
              <span className="truncate font-semibold">{player.username}</span>
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

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md bg-muted px-3 py-2 text-center">
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </div>
  </div>
)

const History = () => {
  const router = useRouter()
  const historyQuery = useMatchHistory()

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
          <h1 className="text-3xl font-bold">Match History</h1>
          <p className="text-muted-foreground">
            Your 50 most recent multiplayer matches
          </p>
        </div>
      </div>

      {historyQuery.isPending && (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="size-12" />
        </div>
      )}

      {historyQuery.isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <p className="text-xl font-semibold">Could not load match history.</p>
          <Button onClick={() => historyQuery.refetch()}>Try again</Button>
        </div>
      )}

      {historyQuery.data?.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <TrophyIcon className="size-12 text-muted-foreground" />
          <p className="text-xl font-semibold">No matches recorded yet</p>
          <p className="text-muted-foreground">
            Completed multiplayer matches will appear here.
          </p>
        </div>
      )}

      {historyQuery.data && historyQuery.data.length > 0 && (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-4 pr-4 pb-6">
            {historyQuery.data.map((match) => (
              <MatchCard key={match.matchId} match={match} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export const HistoryRoute = createRoute({
  getParentRoute: () => AppRoute,
  component: History,
  path: '/history',
})
