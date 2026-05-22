export type MatchResultInput = {
  userId: string
  score: number
  lines: number
  level: number
  rank: number
}

export type CreateMatchInput = {
  durationSeconds: number
  results: MatchResultInput[]
}
