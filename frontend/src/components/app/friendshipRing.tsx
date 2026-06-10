const GAMES_PER_FRIENDSHIP_LEVEL = 5

const SIZE = 96
const STROKE_WIDTH = 7
const RADIUS = (SIZE - STROKE_WIDTH) / 2 - 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export function FriendshipRing({ sharedMatchCount }: { sharedMatchCount: number }) {
  const level = Math.floor(sharedMatchCount / GAMES_PER_FRIENDSHIP_LEVEL) + 1
  const gamesIntoLevel = sharedMatchCount % GAMES_PER_FRIENDSHIP_LEVEL
  const progress = gamesIntoLevel / GAMES_PER_FRIENDSHIP_LEVEL
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            className="stroke-muted"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="stroke-pink-500 transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none">{level}</span>
        </div>
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Friendship
      </span>
      <span className="text-xs text-muted-foreground">
        {gamesIntoLevel} / {GAMES_PER_FRIENDSHIP_LEVEL} games
      </span>
    </div>
  )
}
