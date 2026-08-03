import { Test, TestingModule } from '@nestjs/testing';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { CallType } from '@prisma/client';
import { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('CallsController', () => {
  let controller: CallsController;
  let service: CallsService;

  const mockCallsService = {
    createCall: jest.fn(),
    acceptCall: jest.fn(),
    rejectCall: jest.fn(),
    cancelCall: jest.fn(),
    endCall: jest.fn(),
    getConversationCalls: jest.fn(),
    getAgoraToken: jest.fn(),
  };

  const mockUser: AuthenticatedUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'user@example.com',
    role: 'TOURIST',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CallsController],
      providers: [
        {
          provide: CallsService,
          useValue: mockCallsService,
        },
      ],
    }).compile();

    controller = module.get<CallsController>(CallsController);
    service = module.get<CallsService>(CallsService);
    jest.clearAllMocks();
  });

  describe('POST /conversations/:conversationId/calls (ring)', () => {
    it('should delegate createCall to CallsService', async () => {
      const conversationId = 'conv-123';
      const dto = { type: CallType.AUDIO };
      mockCallsService.createCall.mockResolvedValue({ message: 'Đã bắt đầu cuộc gọi' });

      const result = await controller.createCall(mockUser, conversationId, dto);

      expect(service.createCall).toHaveBeenCalledWith(mockUser.id, conversationId, dto);
      expect(result).toEqual({ message: 'Đã bắt đầu cuộc gọi' });
    });
  });

  describe('PATCH /calls/:callId/accept (accept)', () => {
    it('should delegate acceptCall to CallsService', async () => {
      const callId = 'call-123';
      mockCallsService.acceptCall.mockResolvedValue({ message: 'Đã chấp nhận cuộc gọi' });

      const result = await controller.acceptCall(mockUser, callId);

      expect(service.acceptCall).toHaveBeenCalledWith(mockUser.id, callId);
      expect(result).toEqual({ message: 'Đã chấp nhận cuộc gọi' });
    });
  });

  describe('PATCH /calls/:callId/reject (reject)', () => {
    it('should delegate rejectCall to CallsService', async () => {
      const callId = 'call-123';
      mockCallsService.rejectCall.mockResolvedValue({ message: 'Đã từ chối cuộc gọi' });

      const result = await controller.rejectCall(mockUser, callId);

      expect(service.rejectCall).toHaveBeenCalledWith(mockUser.id, callId);
      expect(result).toEqual({ message: 'Đã từ chối cuộc gọi' });
    });
  });

  describe('PATCH /calls/:callId/cancel (cancel)', () => {
    it('should delegate cancelCall to CallsService', async () => {
      const callId = 'call-123';
      mockCallsService.cancelCall.mockResolvedValue({ message: 'Đã hủy cuộc gọi' });

      const result = await controller.cancelCall(mockUser, callId);

      expect(service.cancelCall).toHaveBeenCalledWith(mockUser.id, callId);
      expect(result).toEqual({ message: 'Đã hủy cuộc gọi' });
    });
  });

  describe('PATCH /calls/:callId/end (end)', () => {
    it('should delegate endCall to CallsService', async () => {
      const callId = 'call-123';
      mockCallsService.endCall.mockResolvedValue({ message: 'Cuộc gọi đã kết thúc' });

      const result = await controller.endCall(mockUser, callId);

      expect(service.endCall).toHaveBeenCalledWith(mockUser.id, callId);
      expect(result).toEqual({ message: 'Cuộc gọi đã kết thúc' });
    });
  });
});
