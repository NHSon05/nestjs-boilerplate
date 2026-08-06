import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CallStatus, CallType, ConversationStatus } from '@prisma/client';
import { CallsService } from './calls.service';
import { PrismaService } from 'src/database/prisma.service';
import { CallsGateway } from './calls.gateway';
import { AgoraService } from 'src/agora/agora.service';
import { NotificationsService } from 'src/notifications/notifications.service';

describe('CallsService', () => {
  let service: CallsService;

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
      rtcToken: 'mock-agora-token',
      appId: 'mock-app-id',
    }),
  };

  const mockNotificationsService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CallsGateway,
          useValue: mockCallsGateway,
        },
        {
          provide: AgoraService,
          useValue: mockAgoraService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<CallsService>(CallsService);
    jest.clearAllMocks();
  });

  describe('createCall (Ring)', () => {
    const callerId = '550e8400-e29b-41d4-a716-446655440000';
    const receiverId = '550e8400-e29b-41d4-a716-446655440001';
    const conversationId = 'c1b2c3d4-5678-90ab-cdef-1234567890ab';

    it('should create a call with RINGING status and emit incoming call event', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.ACTIVE,
        members: [{ userId: callerId }, { userId: receiverId }],
      });
      mockPrismaService.callRecord.findFirst.mockResolvedValue(null);
      mockPrismaService.callRecord.create.mockResolvedValue({
        id: 'call-123',
        conversationId,
        callerId,
        receiverId,
        type: CallType.AUDIO,
        status: CallStatus.RINGING,
        provider: 'AGORA',
        channelName: 'call_channel_123',
        ringingAt: new Date(),
        caller: { id: callerId, fullName: 'Caller', avatarUrl: null },
        receiver: { id: receiverId, fullName: 'Receiver', avatarUrl: null },
      });

      const result = await service.createCall(callerId, conversationId, {
        type: CallType.AUDIO,
      });

      expect(result.message).toBe('Đã bắt đầu cuộc gọi');
      expect(result.data.call.status).toBe(CallStatus.RINGING);
      expect(result.data.agora).toBeDefined();
      expect(mockCallsGateway.emitIncomingCall).toHaveBeenCalledWith(
        receiverId,
        expect.objectContaining({
          callId: 'call-123',
          conversationId,
          type: CallType.AUDIO,
          status: CallStatus.RINGING,
        }),
      );
    });

    it('should throw NotFoundException if conversation does not exist', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.createCall(callerId, conversationId, { type: CallType.AUDIO }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if conversation is closed', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.CLOSED,
        members: [{ userId: callerId }, { userId: receiverId }],
      });

      await expect(
        service.createCall(callerId, conversationId, { type: CallType.AUDIO }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if caller is not a conversation member', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.ACTIVE,
        members: [{ userId: 'other-user-1' }, { userId: receiverId }],
      });

      await expect(
        service.createCall(callerId, conversationId, { type: CallType.AUDIO }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if receiver is not found', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.ACTIVE,
        members: [{ userId: callerId }],
      });

      await expect(
        service.createCall(callerId, conversationId, { type: CallType.AUDIO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if there is already an active call', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue({
        id: conversationId,
        status: ConversationStatus.ACTIVE,
        members: [{ userId: callerId }, { userId: receiverId }],
      });
      mockPrismaService.callRecord.findFirst.mockResolvedValue({
        id: 'existing-call',
      });

      await expect(
        service.createCall(callerId, conversationId, { type: CallType.AUDIO }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptCall (Accept)', () => {
    const callerId = '550e8400-e29b-41d4-a716-446655440000';
    const receiverId = '550e8400-e29b-41d4-a716-446655440001';
    const callId = 'call-123';

    it('should accept call successfully and emit call accepted event', async () => {
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
          conversationId: 'conv-123',
          channelName: 'call_channel_123',
          type: CallType.VIDEO,
          status: CallStatus.ACCEPTED,
          acceptedAt: new Date(),
        });

      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.acceptCall(receiverId, callId);

      expect(result.message).toBe('Đã chấp nhận cuộc gọi');
      expect(result.data.call.status).toBe(CallStatus.ACCEPTED);
      expect(result.data.agora).toBeDefined();
      expect(mockCallsGateway.emitCallAccepted).toHaveBeenCalledWith(
        callerId,
        receiverId,
        expect.objectContaining({
          callId,
          status: CallStatus.ACCEPTED,
        }),
      );
    });

    it('should throw ForbiddenException if user is not the receiver', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });

      await expect(service.acceptCall('wrong-user-id', callId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if call is no longer RINGING', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.acceptCall(receiverId, callId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('rejectCall (Reject)', () => {
    const callerId = '550e8400-e29b-41d4-a716-446655440000';
    const receiverId = '550e8400-e29b-41d4-a716-446655440001';
    const callId = 'call-123';

    it('should reject call successfully and emit call rejected event', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.rejectCall(receiverId, callId);

      expect(result.message).toBe('Đã từ chối cuộc gọi');
      expect(result.data.status).toBe(CallStatus.REJECTED);
      expect(mockCallsGateway.emitCallRejected).toHaveBeenCalledWith(
        callerId,
        expect.objectContaining({
          callId,
          status: CallStatus.REJECTED,
        }),
      );
    });

    it('should throw ForbiddenException if non-receiver tries to reject', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });

      await expect(service.rejectCall(callerId, callId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if update fails', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.rejectCall(receiverId, callId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancelCall (Cancel)', () => {
    const callerId = '550e8400-e29b-41d4-a716-446655440000';
    const receiverId = '550e8400-e29b-41d4-a716-446655440001';
    const callId = 'call-123';

    it('should cancel call successfully and emit call cancelled event', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.cancelCall(callerId, callId);

      expect(result.message).toBe('Đã hủy cuộc gọi');
      expect(result.data.status).toBe(CallStatus.CANCELLED);
      expect(mockCallsGateway.emitCallCancelled).toHaveBeenCalledWith(
        receiverId,
        expect.objectContaining({
          callId,
          status: CallStatus.CANCELLED,
        }),
      );
    });

    it('should throw ForbiddenException if non-caller tries to cancel', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });

      await expect(service.cancelCall(receiverId, callId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if update fails', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.cancelCall(callerId, callId)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('endCall (End)', () => {
    const callerId = '550e8400-e29b-41d4-a716-446655440000';
    const receiverId = '550e8400-e29b-41d4-a716-446655440001';
    const callId = 'call-123';

    it('should end call successfully and calculate duration', async () => {
      const startedAt = new Date(Date.now() - 30000); // 30 seconds ago
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.ACCEPTED,
        startedAt,
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.endCall(callerId, callId);

      expect(result.message).toBe('Cuộc gọi đã kết thúc');
      expect(result.data.status).toBe(CallStatus.ENDED);
      expect(result.data.durationSecs).toBeGreaterThanOrEqual(29);
      expect(mockCallsGateway.emitCallEnded).toHaveBeenCalledWith(
        callerId,
        receiverId,
        expect.objectContaining({
          callId,
          status: CallStatus.ENDED,
        }),
      );
    });

    it('should throw ForbiddenException if user is not a participant', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.ACCEPTED,
      });

      await expect(
        service.endCall('unrelated-user-id', callId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if call status is not ACCEPTED', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.RINGING,
      });

      await expect(service.endCall(callerId, callId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if updateMany returns count 0', async () => {
      mockPrismaService.callRecord.findUnique.mockResolvedValue({
        id: callId,
        callerId,
        receiverId,
        status: CallStatus.ACCEPTED,
        startedAt: new Date(),
      });
      mockPrismaService.callRecord.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.endCall(callerId, callId)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
