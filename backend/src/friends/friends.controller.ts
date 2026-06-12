import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard, UserId } from '../auth/auth.guard'
import {
  GetMessagesQueryDto,
  InviteToMatchDto,
  SendDirectMessageDto,
  SendFriendRequestDto,
  UpdatePresenceDto,
} from './dto'
import { FriendsService } from './friends.service'

@UseGuards(AuthGuard)
@Controller()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('friends/requests')
  async sendFriendRequest(
    @UserId() userId: string,
    @Body() body: SendFriendRequestDto,
  ) {
    const req = await this.friendsService.sendFriendRequest(
      userId,
      body.userIdentifier,
    )
    return { id: req.id, status: req.status, createdAt: req.createdAt }
  }

  @Get('friends/requests/incoming')
  async incoming(@UserId() userId: string) {
    const requests = await this.friendsService.listIncomingRequests(userId)
    return {
      requests: requests.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        fromUser: {
          id: r.fromUserId,
          username: r.fromUser?.username ?? '',
          profilePictureId: r.fromUser?.profilePictureId ?? null,
        },
      })),
    }
  }

  @Get('friends/requests/outgoing')
  async outgoing(@UserId() userId: string) {
    const requests = await this.friendsService.listOutgoingRequests(userId)
    return {
      requests: requests.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        toUser: {
          id: r.toUserId,
          username: r.toUser?.username ?? '',
          profilePictureId: r.toUser?.profilePictureId ?? null,
        },
      })),
    }
  }

  @Post('friends/requests/:requestId/accept')
  async accept(
    @UserId() userId: string,
    @Param('requestId') requestId: string,
  ) {
    const friendship = await this.friendsService.acceptRequest(
      requestId,
      userId,
    )
    return { friendshipId: friendship.id }
  }

  @Post('friends/requests/:requestId/deny')
  async deny(@UserId() userId: string, @Param('requestId') requestId: string) {
    await this.friendsService.denyRequest(requestId, userId)
    return {}
  }

  @Get('friends/blocked')
  async getBlockedUsers(@UserId() userId: string) {
    const blocked = await this.friendsService.getBlockedUsers(userId)
    return { blocked }
  }

  @Post('friends/requests/:requestId/cancel')
  async cancel(
    @UserId() userId: string,
    @Param('requestId') requestId: string,
  ) {
    await this.friendsService.cancelRequest(requestId, userId)
    return {}
  }

  @Get('friends')
  async listFriends(@UserId() userId: string) {
    const friends = await this.friendsService.listFriends(userId)
    return { friends }
  }

  @Delete('friends/:friendUserId')
  async deleteFriend(
    @UserId() userId: string,
    @Param('friendUserId') friendUserId: string,
  ) {
    await this.friendsService.deleteFriend(userId, friendUserId)
    return {}
  }

  @Patch('presence')
  async updatePresence(
    @UserId() userId: string,
    @Body() body: UpdatePresenceDto,
  ) {
    const presence = await this.friendsService.updateMyPresence(
      userId,
      body.status,
    )
    return {
      status: presence.status,
      lastSeenAt: presence.lastSeenAt,
      updatedAt: presence.updatedAt,
    }
  }

  @Post('dm/:friendUserId/messages')
  async sendMessage(
    @UserId() userId: string,
    @Param('friendUserId') friendUserId: string,
    @Body() body: SendDirectMessageDto,
  ) {
    const msg = await this.friendsService.sendDirectMessage(
      userId,
      friendUserId,
      body.content,
    )
    return {
      id: msg.id,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      content: msg.content,
      type: msg.type,
      roomId: msg.roomId,
      createdAt: msg.createdAt,
    }
  }

  @Post('dm/:friendUserId/invite')
  async inviteToMatch(
    @UserId() userId: string,
    @Param('friendUserId') friendUserId: string,
    @Body() body: InviteToMatchDto,
  ) {
    const msg = await this.friendsService.sendMatchInvite(
      userId,
      friendUserId,
      body.roomId,
    )
    return {
      id: msg.id,
      senderId: msg.senderId,
      recipientId: msg.recipientId,
      content: msg.content,
      type: msg.type,
      roomId: msg.roomId,
      createdAt: msg.createdAt,
    }
  }

  @Get('dm/:friendUserId/messages')
  async getMessages(
    @UserId() userId: string,
    @Param('friendUserId') friendUserId: string,
    @Query() query: GetMessagesQueryDto,
  ) {
    const result = await this.friendsService.getDirectMessages(
      userId,
      friendUserId,
      {
        limit: query.limit,
        before: query.before,
        after: query.after,
      },
    )

    return {
      messages: result.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        content: m.content,
        type: m.type,
        roomId: m.roomId,
        createdAt: m.createdAt,
      })),
      pageInfo: result.pageInfo,
    }
  }

  @Post('friends/block/:userId')
  @HttpCode(200)
  async blockUser(
    @UserId() userId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.friendsService.blockUser(userId, targetUserId)
    return {}
  }

  @Delete('friends/block/:userId')
  async unblockUser(
    @UserId() userId: string,
    @Param('userId') targetUserId: string,
  ) {
    await this.friendsService.unblockUser(userId, targetUserId)
    return {}
  }

  @Get('friends/blocked')
  async listBlocked(@UserId() userId: string) {
    const blocked = await this.friendsService.listBlocked(userId)
    return { blocked }
  }
}
