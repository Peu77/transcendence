import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/lib/client.ts'

export const FRIENDS_QUERY_KEYS = {
  FRIENDS: ['friends'],
  OUTGOING_REQUESTS: ['friends', 'requests', 'outgoing'],
  INCOMING_REQUESTS: ['friends', 'requests', 'incoming'],
}

export function useGetFriends() {
  return useQuery({
    queryKey: FRIENDS_QUERY_KEYS.FRIENDS,
    queryFn: getFriends,
  })
}

export function useGetOutgoingFriendRequests() {
  return useQuery({
    queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
    queryFn: getOutgoingFriendRequests,
  })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
      })
    },
  })
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FRIENDS_QUERY_KEYS.OUTGOING_REQUESTS,
      })
    },
  })
}

export async function blockUser(blockedId: string): Promise<void> {
  await axios.post(`/friends/block/${blockedId}`)
}

export function useBlockUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: blockUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: FRIENDS_QUERY_KEYS.INCOMING_REQUESTS,
      })
    },
  })
}

export type PresenceStatus = 'online' | 'offline' | 'away'

export type FriendRequestUser = {
  id: string
  username: string
  profilePictureId: string | null
}

export type IncomingFriendRequest = {
  id: string
  createdAt: string
  fromUser: FriendRequestUser
}

export type OutgoingFriendRequest = {
  id: string
  createdAt: string
  toUser: FriendRequestUser
}

export type FriendPresence = {
  status: PresenceStatus
  lastSeenAt: string | null
  updatedAt?: string
}

export type Friend = {
  id: string
  username: string
  profilePictureId: string | null
  presence?: FriendPresence
}

export type SendFriendRequestRequest = { userIdentifier: string }
export type SendFriendRequestResponse = {
  id: string
  status: string
  createdAt: string
}

export async function sendFriendRequest(
  values: SendFriendRequestRequest,
): Promise<SendFriendRequestResponse> {
  const res = await axios.post<SendFriendRequestResponse>(
    '/friends/requests',
    values,
  )
  return res.data
}

export type IncomingFriendRequestsResponse = {
  requests: IncomingFriendRequest[]
}

export async function getIncomingFriendRequests(): Promise<
  IncomingFriendRequest[]
> {
  const res = await axios.get<IncomingFriendRequestsResponse>(
    '/friends/requests/incoming',
  )
  return res.data.requests
}

export type OutgoingFriendRequestsResponse = {
  requests: OutgoingFriendRequest[]
}

export async function getOutgoingFriendRequests(): Promise<
  OutgoingFriendRequest[]
> {
  const res = await axios.get<OutgoingFriendRequestsResponse>(
    '/friends/requests/outgoing',
  )
  return res.data.requests
}

export type AcceptFriendRequestResponse = { friendshipId: string }

export async function acceptFriendRequest(
  requestId: string,
): Promise<AcceptFriendRequestResponse> {
  const res = await axios.post<AcceptFriendRequestResponse>(
    `/friends/requests/${requestId}/accept`,
  )
  return res.data
}

export async function denyFriendRequest(requestId: string): Promise<{}> {
  const res = await axios.post(`/friends/requests/${requestId}/deny`)
  return res.data
}

export async function cancelFriendRequest(requestId: string): Promise<{}> {
  const res = await axios.post(`/friends/requests/${requestId}/cancel`)
  return res.data
}

export type GetFriendsResponse = {
  friends: Friend[]
}

export async function getFriends(): Promise<Friend[]> {
  const res = await axios.get<GetFriendsResponse>('/friends')
  return res.data.friends
}

export async function deleteFriend(friendUserId: string): Promise<{}> {
  const res = await axios.delete(`/friends/${friendUserId}`)
  return res.data
}

export type UpdatePresenceRequest = { status: PresenceStatus }
export type UpdatePresenceResponse = {
  status: PresenceStatus
  lastSeenAt: string | null
  updatedAt: string
}

export async function updateMyPresence(
  values: UpdatePresenceRequest,
): Promise<UpdatePresenceResponse> {
  const res = await axios.patch<UpdatePresenceResponse>('/presence', values)
  return res.data
}

export type DirectMessage = {
  id: string
  senderId: string
  recipientId: string
  content: string
  createdAt: string
}

export type SendDirectMessageRequest = { content: string }

export async function sendDirectMessage(
  friendUserId: string,
  values: SendDirectMessageRequest,
): Promise<DirectMessage> {
  const res = await axios.post<DirectMessage>(
    `/dm/${friendUserId}/messages`,
    values,
  )
  return res.data
}

export type DirectMessagesPageInfo = {
  oldestCursor: string | null
  newestCursor: string | null
  hasOlder: boolean
  hasNewer: boolean
}

export type GetDirectMessagesResponse = {
  messages: DirectMessage[]
  pageInfo: DirectMessagesPageInfo
}

export type GetDirectMessagesParams = {
  limit?: number
  before?: string
  after?: string
}

export async function getDirectMessages(
  friendUserId: string,
  params: GetDirectMessagesParams = {},
): Promise<GetDirectMessagesResponse> {
  const res = await axios.get<GetDirectMessagesResponse>(
    `/dm/${friendUserId}/messages`,
    { params },
  )
  return res.data
}
