import { axios } from '@/lib/client.ts'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type PublicApiEndpoint = {
  method: 'GET'
  path: string
  title: string
  description: string
  exampleResponse: Record<string, unknown>
}

export type ApiKey = {
  id: string
  name: string
  keyPreview: string
  rateLimitPerMinute: number
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export type ApiKeyOverview = {
  apiKeys: ApiKey[]
  endpoints: PublicApiEndpoint[]
}

export const PUBLIC_API_QUERY_KEYS = {
  OVERVIEW: ['public-api-overview'],
}

export function usePublicApiOverview() {
  return useQuery({
    queryKey: PUBLIC_API_QUERY_KEYS.OVERVIEW,
    queryFn: async () => {
      const res = await axios.get<ApiKeyOverview>('/api-keys')
      return res.data
    },
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await axios.post<{ apiKey: ApiKey; key: string }>(
        '/api-keys',
        { name },
      )
      return res.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PUBLIC_API_QUERY_KEYS.OVERVIEW,
      })
    },
  })
}

export function useRenameApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await axios.patch<{ apiKey: ApiKey }>(`/api-keys/${id}`, {
        name,
      })
      return res.data.apiKey
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PUBLIC_API_QUERY_KEYS.OVERVIEW,
      })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api-keys/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PUBLIC_API_QUERY_KEYS.OVERVIEW,
      })
    },
  })
}
