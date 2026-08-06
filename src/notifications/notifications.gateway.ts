import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { NotificationPayload } from './interfaces/notification-payload.interface';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

interface AuthenticatedNotificationSocket extends Socket {
  data: {
    user?: {
      id: string;
      email?: string;
      role?: string;
    };
  };
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(
    client: AuthenticatedNotificationSocket,
  ): Promise<void> {
    try {
      const token = this.extractToken(client);

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload.sub) {
        throw new WsException('Access token không hợp lệ');
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      await client.join(this.getUserRoom(payload.sub));

      client.emit('notification:connected', {
        socketId: client.id,
        userId: payload.sub,
      });
    } catch {
      client.emit('notification:error', {
        code: 'UNAUTHORIZED',
        message: 'Không thể xác thực socket',
      });

      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedNotificationSocket): void {
    this.logger.debug(`Notification socket disconnected: ${client.id}`);
  }

  emitNotification(userId: string, notification: NotificationPayload): void {
    this.server.to(this.getUserRoom(userId)).emit('notification:new', {
      notification,
    });
  }

  emitUnreadCount(userId: string, unreadCount: number): void {
    this.server.to(this.getUserRoom(userId)).emit('notification:unread-count', {
      unreadCount,
    });
  }

  emitNotificationRead(
    userId: string,
    notificationId: string,
    readAt: Date,
  ): void {
    this.server.to(this.getUserRoom(userId)).emit('notification:read', {
      notificationId,
      readAt,
    });
  }

  emitAllRead(userId: string, readAt: Date): void {
    this.server.to(this.getUserRoom(userId)).emit('notification:all-read', {
      readAt,
      unreadCount: 0,
    });
  }

  private extractToken(client: AuthenticatedNotificationSocket): string {
    const auth = client.handshake.auth;
    const token = auth?.token as unknown;

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

  private getUserRoom(userId: string): string {
    return `user:${userId}`;
  }
}
