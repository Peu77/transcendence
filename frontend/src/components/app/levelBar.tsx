const LINES_PER_LEVEL = 10

export const LevelBar = ({ totalLines }: { totalLines: number }) => {
  const level = Math.floor(totalLines / LINES_PER_LEVEL) + 1
  const linesIntoLevel = totalLines % LINES_PER_LEVEL
  const progress = linesIntoLevel / LINES_PER_LEVEL

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Level {level}</span>
        <span>
          {linesIntoLevel} / {LINES_PER_LEVEL} lines
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="text-right text-xs text-muted-foreground">
        Level {level + 1}
      </div>
    </div>
  )
}
