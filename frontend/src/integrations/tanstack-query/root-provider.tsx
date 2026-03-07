import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'

export function Provider({
  children,
  queryClient,
}: Readonly<{
  children: ReactNode
  queryClient: QueryClient
}>) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
