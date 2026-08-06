import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import {
  HttpException,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { ConversationsService } from './conversations.service';
import { MessagesService } from 'src/messages/messages.service';
import type { AuthenticatedChatSocket } from './interfaces/authenticated-chat-socket.interface';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { TypingEventDto } from './dto/typing-event.dto';
import { SocketSendMessageDto } from './dto/socket-send-message.dto';

interface JwtPayload {
  sub: string;
  phone?: string;
  role?: string;
}

@WebSocketGateway({
  namespace: '/chat',

  cors: {
    origin: true,
    credentials: true,
  },

  transports: ['websocket'],
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class ConversationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(ConversationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * Xác thực socket và đưa tất cả thiết bị/socket
   * của user vào room riêng user:{userId}.
   */
  async handleConnection(client: AuthenticatedChatSocket): Promise<void> {
    try {
      const token = this.extractAccessToken(client);

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload.sub) {
        throw new WsException('Access token không chứa userId');
      }

      client.data.user = {
        id: payload.sub,
        phone: payload.phone,
        role: payload.role,
      };

      await client.join(this.getUserRoom(payload.sub));

      this.logger.log(`Socket connected: ${client.id}, user: ${payload.sub}`);

      client.emit('socket:connected', {
        socketId: client.id,
        userId: payload.sub,
      });
    } catch (error) {
      this.logger.warn(`Socket authentication failed: ${client.id}`);

      client.emit('socket:error', {
        code: 'UNAUTHORIZED',
        message:
          error instanceof Error
            ? error.message
            : 'Không thể xác thực kết nối realtime',
      });

      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedChatSocket): void {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  /**
   * Client mở màn hình chat.
   *
   * Client emit:
   * conversation:join
   */
  @SubscribeMessage('conversation:join')
  async joinConversation(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: JoinConversationDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      await this.conversationsService.assertActiveMember(
        userId,
        dto.conversationId,
      );

      const room = this.getConversationRoom(dto.conversationId);

      await client.join(room);

      return {
        event: 'conversation:joined',
        data: {
          conversationId: dto.conversationId,
          userId,
        },
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  /**
   * Client đóng màn hình chat.
   */
  @SubscribeMessage('conversation:leave')
  async leaveConversation(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: JoinConversationDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      await client.leave(this.getConversationRoom(dto.conversationId));

      return {
        event: 'conversation:left',
        data: {
          conversationId: dto.conversationId,
          userId,
        },
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  /**
   * Gửi message realtime.
   *
   * Gateway không tự tạo message.
   * Toàn bộ business logic vẫn nằm trong MessagesService.
   */
  @SubscribeMessage('message:send')
  async sendMessage(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: SocketSendMessageDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      const result = await this.messagesService.create(
        userId,
        dto.conversationId,
        {
          type: dto.type,
          content: dto.content,
          clientMessageId: dto.clientMessageId,
          replyToId: dto.replyToId,
          attachments: dto.attachments,
        },
      );

      const message = result.data;

      /*
       * Emit tới toàn bộ room, bao gồm sender.
       * Sender nhận lại message chính thức từ database.
       */
      this.server
        .to(this.getConversationRoom(dto.conversationId))
        .emit('message:new', {
          conversationId: dto.conversationId,
          message,
          duplicated: result.duplicated,
        });

      /*
       * Gửi tới user rooms để cập nhật sidebar,
       * kể cả khi người dùng chưa join conversation room.
       */
      await this.emitConversationUpdated(dto.conversationId, message);

      return {
        event: 'message:sent',
        data: {
          conversationId: dto.conversationId,
          message,
          duplicated: result.duplicated,
        },
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  /**
   * Typing không lưu database.
   * Chỉ emit cho các socket khác trong room.
   */
  @SubscribeMessage('typing:start')
  async typingStart(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: TypingEventDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      await this.conversationsService.assertActiveMember(
        userId,
        dto.conversationId,
      );

      client
        .to(this.getConversationRoom(dto.conversationId))
        .emit('typing:started', {
          conversationId: dto.conversationId,
          userId,
        });

      return {
        event: 'typing:start:ack',
        data: {
          conversationId: dto.conversationId,
        },
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  @SubscribeMessage('typing:stop')
  async typingStop(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: TypingEventDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      await this.conversationsService.assertActiveMember(
        userId,
        dto.conversationId,
      );

      client
        .to(this.getConversationRoom(dto.conversationId))
        .emit('typing:stopped', {
          conversationId: dto.conversationId,
          userId,
        });

      return {
        event: 'typing:stop:ack',
        data: {
          conversationId: dto.conversationId,
        },
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  /**
   * Cập nhật ConversationMember.lastReadAt.
   */
  @SubscribeMessage('conversation:read')
  async markAsRead(
    @ConnectedSocket()
    client: AuthenticatedChatSocket,

    @MessageBody()
    dto: JoinConversationDto,
  ) {
    try {
      const userId = this.getCurrentUserId(client);

      const result = await this.conversationsService.markAsRead(
        userId,
        dto.conversationId,
      );

      const payload = {
        conversationId: dto.conversationId,
        userId,
        lastReadAt: result.data.lastReadAt,
      };

      this.server
        .to(this.getConversationRoom(dto.conversationId))
        .emit('conversation:read', payload);

      return {
        event: 'conversation:read:ack',
        data: payload,
      };
    } catch (error) {
      throw this.toWsException(error);
    }
  }

  /**
   * Dùng từ REST MessagesController sau này.
   */
  emitMessageUpdated(params: {
    conversationId: string;
    message: unknown;
  }): void {
    this.server
      .to(this.getConversationRoom(params.conversationId))
      .emit('message:updated', params);
  }

  emitMessageDeleted(params: {
    conversationId: string;
    messageId: string;
    deletedAt: Date;
  }): void {
    this.server
      .to(this.getConversationRoom(params.conversationId))
      .emit('message:deleted', params);
  }

  emitMessageNew(params: { conversationId: string; message: unknown }): void {
    this.server
      .to(this.getConversationRoom(params.conversationId))
      .emit('message:new', params);
  }

  /**
   * Lấy toàn bộ member của conversation
   * và emit tới room riêng của từng user.
   */
  private async emitConversationUpdated(
    conversationId: string,
    message: unknown,
  ): Promise<void> {
    const members =
      await this.conversationsService.getActiveMemberIds(conversationId);

    const payload = {
      conversationId,
      lastMessage: message,
      lastMessageAt: new Date(),
    };

    for (const memberId of members) {
      this.server
        .to(this.getUserRoom(memberId))
        .emit('conversation:updated', payload);
    }
  }

  private extractAccessToken(client: AuthenticatedChatSocket): string {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const token = auth?.token;

    if (typeof token === 'string' && token.trim()) {
      return token.replace(/^Bearer\s+/i, '');
    }

    const authorization = client.handshake.headers.authorization;

    if (
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization.slice(7);
    }

    throw new WsException('Thiếu access token');
  }

  private getCurrentUserId(client: AuthenticatedChatSocket): string {
    const userId = client.data.user?.id;

    if (!userId) {
      throw new WsException('Socket chưa được xác thực');
    }

    return userId;
  }

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }

  private getConversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
  }

  private toWsException(error: unknown): WsException {
    if (error instanceof WsException) {
      return error;
    }

    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return new WsException({
          statusCode: error.getStatus(),
          message: response,
        });
      }

      return new WsException(response);
    }

    this.logger.error(error instanceof Error ? error.stack : String(error));

    return new WsException({
      statusCode: 500,
      message: 'Lỗi hệ thống realtime',
    });
  }
}
