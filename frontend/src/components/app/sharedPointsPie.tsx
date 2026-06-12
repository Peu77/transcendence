const SIZE = 96
const STROKE_WIDTH = 7
const RADIUS = (SIZE - STROKE_WIDTH) / 2 - 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const CENTER = SIZE / 2

export function SharedPointsPie({
  sharedPoints,
  totalPoints,
}: {
  sharedPoints: number
  totalPoints: number
}) {
  const ratio = totalPoints > 0 ? sharedPoints / totalPoints : 0
  const dashOffset = CIRCUMFERENCE * (1 - ratio)
  const displayPct = totalPoints > 0 ? Math.round(ratio * 100) : 0

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
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
            className="stroke-amber-500 transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold leading-none">{displayPct}%</span>
        </div>
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Points
      </span>
      <span className="text-xs text-muted-foreground">
        {sharedPoints.toLocaleString()} / {totalPoints.toLocaleString()}
      </span>
    </div>
  )
}
