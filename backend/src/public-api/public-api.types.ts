export type PublicApiEndpoint = {
  method: 'GET'
  path: string
  title: string
  description: string
  exampleResponse: Record<string, unknown>
}

export type AuthenticatedApiKey = {
  id: string
  userId: string
  rateLimitPerMinute: number
}
