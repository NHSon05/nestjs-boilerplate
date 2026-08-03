import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { CallsGateway } from './../src/calls/calls.gateway';
import { AgoraService } from './../src/agora/agora.service';
import { CallStatus, CallType, ConversationStatus } from '@prisma/client';

describe('Calls API Endpoints (e2e HTTP calls)', () => {
  let app: INestApplication;

  const callerId = '550e8400-e29b-41d4-a716-446655440000';
  const receiverId = '550e8400-e29b-41d4-a716-446655440001';
  const conversationId = 'c1b2c3d4-5678-90ab-cdef-1234567890ab';
  const callId = 'f1b2c3d4-5678-90ab-cdef-1234567890ab';

  let currentUserId = callerId;

  const mockPrismaService = {
    conversation: {
      findUnique: jest.fn(),
    },
    callRecord: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    conversationMember: {
      findUnique: jest.fn(),
    },
  };

  const mockCallsGateway = {
    emitIncomingCall: jest.fn(),
    emitCallAccepted: jest.fn(),
    emitCallRejected: jest.fn(),
    emitCallCancelled: jest.fn(),
    emitCallEnded: jest.fn(),
  };

  const mockAgoraService = {
    generateRtcToken: jest.fn().mockReturnValue({
      rtcToken: 'mock-agora-rtc-token-e2e',
      appId: 'mock-app-id',
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(CallsGateway)
      .useValue(mockCallsGateway)
      .overrideProvider(AgoraService)
      .useValue(mockAgoraService)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: currentUserId,
            email: 'test@example.com',
            role: 'TOURIST',
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. POST /api/v1/conversations/:conversationId/calls (Start Call / Ring)', () => {
    it('HTTP 201: should start call and return RINGING status with RTC token', async () => {
      currentUserId = callerId;

      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.ACTIVE,
        members: [{ userId: callerId }, { userId: receiverId }],
      });
      mockPrismaService.callRecord.findFirst.mockResolvedValue(null);
      mockPrismaService.callRecord.create.mockResolvedValue({
        id: callId,
        conversationId,
        callerId,
        receiverId,
        type: CallType.AUDIO,
        status: CallStatus.RINGING,
        provider: 'AGORA',
        channelName: 'call_channel_e2e',
        ringingAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        caller: { id: callerId, fullName: 'Caller User', avatarUrl: null },
        receiver: { id: receiverId, fullName: 'Receiver User', avatarUrl: null },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/conversations/${conversationId}/calls`)
        .send({ type: CallType.AUDIO })
        .expect(201);

      expect(res.body.message).toBe('Đã bắt đầu cuộc gọi');
      expect(res.body.data.call.status).toBe('RINGING');
      expect(res.body.data.agora.rtcToken).toBe('mock-agora-rtc-token-e2e');
      expect(mockCallsGateway.emitIncomingCall).toHaveBeenCalled();
    });
  });

  describe('2. PATCH /api/v1/calls/:callId/accept (Accept Call)', () => {
    it('HTTP 200: should accept ringing call and return ACCEPTED status', async () => {
      currentUserId = receiverId;

      mockPrismaService.callRecord.findUnique
        .mockResolvedValueOnce({
          id: callId,
          callerId,
          receiverId,
          status: CallStatus.RINGING,
        })
        .mockResolvedValueOnce({
          id: callId,
          callerId,
          receiverId,
          conversationId,
          channelName: 'call_channel_e2e',
          type: CallType.AUDIO,
          status: CallStatus.ACCEPTED,
          acceptedAt: new Date().toISOString(),
        });

      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/calls/${callId}/accept`)
        .expect(200);

      expect(res.body.message).toBe('Đã chấp nhận cuộc gọi');
      expect(res.body.data.call.status).toBe('ACCEPTED');
      expect(res.body.data.agora.rtcToken).toBe('mock-agora-rtc-token-e2e');
      expect(mockCallsGateway.emitCallAccepted).toHaveBeenCalled();
    });
  });

  describe('3. PATCH /api/v1/calls/:callId/reject (Reject Call)', () => {
    it('HTTP 200: should reject ringing call and return REJECTED status', async () => {
      currentUserId = receiverId;

      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/calls/${callId}/reject`)
        .expect(200);

      expect(res.body.message).toBe('Đã từ chối cuộc gọi');
      expect(res.body.data.status).toBe('REJECTED');
      expect(mockCallsGateway.emitCallRejected).toHaveBeenCalled();
    });
  });

  describe('4. PATCH /api/v1/calls/:callId/cancel (Cancel Call)', () => {
    it('HTTP 200: should cancel ringing call and return CANCELLED status', async () => {
      currentUserId = callerId;

      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/calls/${callId}/cancel`)
        .expect(200);

      expect(res.body.message).toBe('Đã hủy cuộc gọi');
      expect(res.body.data.status).toBe('CANCELLED');
      expect(mockCallsGateway.emitCallCancelled).toHaveBeenCalled();
    });
  });

  describe('5. PATCH /api/v1/calls/:callId/end (End Call)', () => {
    it('HTTP 200: should end accepted call and return ENDED status with durationSecs', async () => {
      currentUserId = callerId;

      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.ACCEPTED,
        startedAt: new Date(Date.now() - 45000),
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/calls/${callId}/end`)
        .expect(200);

      expect(res.body.message).toBe('Cuộc gọi đã kết thúc');
      expect(res.body.data.status).toBe('ENDED');
      expect(res.body.data.durationSecs).toBeGreaterThanOrEqual(44);
      expect(mockCallsGateway.emitCallEnded).toHaveBeenCalled();
    });
  });
});
