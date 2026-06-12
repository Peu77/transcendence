import { useState } from 'react'
import { CopyIcon, KeyRoundIcon, ShieldCheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  type ApiKey,
  type PublicApiEndpoint,
  useCreateApiKey,
  usePublicApiOverview,
  useRenameApiKey,
  useRevokeApiKey,
} from '@/api/publicApi.ts'
import { env } from '@/env.ts'
import { Button } from '@/components/ui/button.tsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'

const formatDate = (value: string | null) => {
  if (!value) return 'Never'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const copyToClipboard = async (value: string, message: string) => {
  await navigator.clipboard.writeText(value)
  toast.success(message)
}

export const PublicApiSettingsAccordion = () => {
  const { data, isLoading } = usePublicApiOverview()
  const createApiKeyMutation = useCreateApiKey()
  const renameApiKeyMutation = useRenameApiKey()
  const revokeApiKeyMutation = useRevokeApiKey()
  const [newKeyName, setNewKeyName] = useState('Tournament overlay')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)

  const handleCreateKey = async () => {
    const name = newKeyName.trim()
    if (!name) {
      toast.error('API key name is required')
      return
    }

    const result = await createApiKeyMutation.mutateAsync(name)
    setNewlyCreatedKey(result.key)
    setNewKeyName('')
    toast.success('API key created')
  }

  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading API settings...</p>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="border-cyan-300/30 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="h-5 w-5 text-cyan-500" /> Create API key
          </CardTitle>
          <CardDescription>
            Keys are shown once. Store the value before closing or refreshing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key-name">Key name</Label>
            <Input
              id="api-key-name"
              value={newKeyName}
              onChange={(event) => setNewKeyName(event.target.value)}
              placeholder="Production dashboard"
            />
          </div>
          <Button
            onClick={handleCreateKey}
            disabled={createApiKeyMutation.isPending}
            className="w-full md:w-auto"
          >
            {createApiKeyMutation.isPending ? 'Creating...' : 'Generate key'}
          </Button>

          {newlyCreatedKey && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-300/60 bg-amber-200/20 p-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200">
                  New key value
                </p>
                <code className="mt-2 block overflow-x-auto rounded bg-black/80 p-3 text-xs text-cyan-200">
                  {newlyCreatedKey}
                </code>
              </div>
              <Button
                variant="outline"
                className="flex gap-2"
                onClick={() =>
                  copyToClipboard(newlyCreatedKey, 'API key copied')
                }
              >
                <CopyIcon className="h-4 w-4" /> Copy
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ApiKeyList
        apiKeys={data?.apiKeys ?? []}
        onRename={(id, name) => renameApiKeyMutation.mutateAsync({ id, name })}
        onRevoke={(id) => revokeApiKeyMutation.mutateAsync(id)}
      />

      <EndpointDocs endpoints={data?.endpoints ?? []} />
    </div>
  )
}

type ApiKeyListProps = {
  apiKeys: ApiKey[]
  onRename: (id: string, name: string) => Promise<ApiKey>
  onRevoke: (id: string) => Promise<void>
}

const ApiKeyList = ({ apiKeys, onRename, onRevoke }: ApiKeyListProps) => {
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')

  const startRename = (apiKey: ApiKey) => {
    setEditingKeyId(apiKey.id)
    setDraftName(apiKey.name)
  }

  const saveRename = async (apiKey: ApiKey) => {
    const name = draftName.trim()
    if (!name) {
      toast.error('API key name is required')
      return
    }

    await onRename(apiKey.id, name)
    setEditingKeyId(null)
    toast.success('API key renamed')
  }

  const revoke = async (apiKey: ApiKey) => {
    await onRevoke(apiKey.id)
    toast.success('API key revoked')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-emerald-500" /> Manage keys
        </CardTitle>
        <CardDescription>
          Revoked keys remain visible for audit context but cannot call the API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiKeys.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No keys yet. Generate one to unlock public API access.
          </p>
        ) : (
          apiKeys.map((apiKey) => {
            const isEditing = editingKeyId === apiKey.id
            const revoked = Boolean(apiKey.revokedAt)

            return (
              <div
                key={apiKey.id}
                className="rounded-xl border bg-background/70 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isEditing ? (
                        <Input
                          value={draftName}
                          onChange={(event) => setDraftName(event.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        <h3 className="text-lg">{apiKey.name}</h3>
                      )}
                      <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {revoked ? 'revoked' : 'live'}
                      </span>
                    </div>
                    <code className="block overflow-x-auto rounded bg-muted px-3 py-2 text-xs">
                      {apiKey.keyPreview}
                    </code>
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <Button onClick={() => saveRename(apiKey)}>Save</Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => startRename(apiKey)}
                        disabled={revoked}
                      >
                        Rename
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => revoke(apiKey)}
                      disabled={revoked}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                  <span>{apiKey.rateLimitPerMinute}/min</span>
                  <span>Created {formatDate(apiKey.createdAt)}</span>
                  <span>Last used {formatDate(apiKey.lastUsedAt)}</span>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

type EndpointDocsProps = {
  endpoints: PublicApiEndpoint[]
}

const EndpointDocs = ({ endpoints }: EndpointDocsProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Documentation</CardTitle>
      <CardDescription>
        Send your key as <code>x-api-key</code> or as a Bearer token. All
        endpoints return data from the current application database.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {endpoints.map((endpoint) => {
        const url = `${env.VITE_BACKEND_URL}${endpoint.path}`
        const curl = `curl -H "x-api-key: trn_your_key" ${url}`

        return (
          <div
            key={endpoint.path}
            className="rounded-xl border bg-muted/30 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-cyan-500 px-2 py-1 text-xs text-white">
                    {endpoint.method}
                  </span>
                  <code className="text-xs">{endpoint.path}</code>
                </div>
                <h3 className="mt-2 text-lg">{endpoint.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {endpoint.description}
                </p>
              </div>
              <Button
                variant="outline"
                className="flex gap-2"
                onClick={() => copyToClipboard(curl, 'cURL example copied')}
              >
                <CopyIcon className="h-4 w-4" /> cURL
              </Button>
            </div>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black p-3 text-xs text-cyan-100">
              {JSON.stringify(endpoint.exampleResponse, null, 2)}
            </pre>
          </div>
        )
      })}
    </CardContent>
  </Card>
)
