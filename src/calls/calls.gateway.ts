import {
  // Lấy socket hiện tại
  ConnectedSocket,
  // Lấy data từ client
  MessageBody,
  // Xử lý khi client kết nối
  OnGatewayConnection,
  // Xử lý khi client ngắt kết nối
  OnGatewayDisconnect,
  // Lắng nghe sự kiện từ client
  SubscribeMessage,
  // class
  WebSocketGateway,
  // Lấy SocketIO emit event
  WebSocketServer,
  // Throw lỗi trong Websocket
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

@WebSocketGateway({
  namespace: '/calls',
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractAccessToken(client);

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });

      if (!payload.sub) {
        throw new WsException('Access token không hợp lệ');
      }

      // gán thông tin người dùng vào socket
      client.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };

      // Cho socket vào room cá nhân
      await client.join(this.getUserRoom(payload.sub));

      client.emit('socket:connected', {
        userId: payload.sub,
        socketId: client.id,
      });
    } catch {
      client.emit('socket:error', {
        message: 'Không thể xác thực kết nối realtime',
      });

      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    console.log(`Call socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('call:join')
  async joinCallRoom(
    @ConnectedSocket()
    client: AuthenticatedSocket,

    @MessageBody()
    payload: {
      callId: string;
    },
  ) {
    if (!client.user) {
      throw new WsException('Socket chưa được xác thực');
    }

    if (!payload?.callId) {
      throw new WsException('callId là bắt buộc');
    }

    await client.join(this.getCallRoom(payload.callId));

    return {
      event: 'call:joined',
      data: {
        callId: payload.callId,
      },
    };
  }

  @SubscribeMessage('call:leave')
  async leaveCallRoom(
    @ConnectedSocket()
    client: AuthenticatedSocket,

    @MessageBody()
    payload: {
      callId: string;
    },
  ) {
    await client.leave(this.getCallRoom(payload.callId));

    return {
      event: 'call:left',
      data: {
        callId: payload.callId,
      },
    };
  }

  emitIncomingCall(receiverId: string, data: unknown): void {
    this.server.to(this.getUserRoom(receiverId)).emit('call:incoming', data);
  }

  emitCallAccepted(callerId: string, receiverId: string, data: unknown): void {
    this.server
      .to([this.getUserRoom(callerId), this.getUserRoom(receiverId)])
      .emit('call:accepted', data);
  }

  emitCallRejected(callerId: string, data: unknown): void {
    this.server.to(this.getUserRoom(callerId)).emit('call:rejected', data);
  }

  emitCallCancelled(receiverId: string, data: unknown): void {
    this.server.to(this.getUserRoom(receiverId)).emit('call:cancelled', data);
  }

  emitCallEnded(callerId: string, receiverId: string, data: unknown): void {
    this.server
      .to([this.getUserRoom(callerId), this.getUserRoom(receiverId)])
      .emit('call:ended', data);
  }

  emitCallMissed(callerId: string, receiverId: string, data: unknown): void {
    this.server
      .to([this.getUserRoom(callerId), this.getUserRoom(receiverId)])
      .emit('call:missed', data);
  }

  private extractAccessToken(client: AuthenticatedSocket): string {
    const authToken = client.handshake.auth?.token as unknown;

    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
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

  private getCallRoom(callId: string): string {
    return `call:${callId}`;
  }
}
