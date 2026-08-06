import { Test, TestingModule } from '@nestjs/testing';
import { GuideRequestsService } from './guide-requests.service';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { GuideRequestStatus } from '@prisma/client';

describe('GuideRequestsService', () => {
  let service: GuideRequestsService;

  const mockPrismaTx = {
    guideRequest: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    conversation: {
      create: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  };

  const mockPrismaService = {
    $transaction: jest.fn((cb: (tx: any) => Promise<any>) => cb(mockPrismaTx)),
  };

  const mockNotificationsService = {
    createWithTransaction: jest.fn().mockResolvedValue({ id: 'noti-123', userId: 'user-123' }),
    emitCreatedNotification: jest.fn(),
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuideRequestsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<GuideRequestsService>(GuideRequestsService);
    jest.clearAllMocks();
  });

  describe('accept', () => {
    it('should accept a pending request and return acceptedAt timestamp', async () => {
      const guideId = 'guide-123';
      const requestId = 'req-123';

      mockPrismaTx.guideRequest.findUnique.mockResolvedValue({
        id: requestId,
        touristId: 'tourist-123',
        guideId: guideId,
        status: GuideRequestStatus.PENDING,
        conversation: null,
      });

      mockPrismaTx.guideRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaTx.conversation.create.mockResolvedValue({ id: 'conv-123' });
      mockPrismaTx.notification.create.mockResolvedValue({});

      const result = await service.accept(guideId, requestId);

      expect(result.data.status).toBe(GuideRequestStatus.ACCEPTED);
      expect(result.data.conversationId).toBe('conv-123');
      expect(mockPrismaTx.guideRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GuideRequestStatus.ACCEPTED,
            acceptedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending request and return rejectedAt timestamp', async () => {
      const guideId = 'guide-123';
      const requestId = 'req-123';

      mockPrismaTx.guideRequest.findUnique.mockResolvedValue({
        id: requestId,
        touristId: 'tourist-123',
        guideId: guideId,
        status: GuideRequestStatus.PENDING,
      });

      mockPrismaTx.guideRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaTx.notification.create.mockResolvedValue({});

      const result = await service.reject(guideId, requestId, {
        reason: 'Busy schedule',
      });

      expect(result.data.status).toBe(GuideRequestStatus.REJECTED);
      expect(result.data.rejectionReason).toBe('Busy schedule');
      expect(mockPrismaTx.guideRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GuideRequestStatus.REJECTED,
            rejectedAt: expect.any(Date),
            rejectionReason: 'Busy schedule',
          }),
        }),
      );
    });
  });

  describe('cancel', () => {
    it('should cancel a request and return cancelledAt timestamp', async () => {
      const touristId = 'tourist-123';
      const requestId = 'req-123';

      mockPrismaTx.guideRequest.findUnique.mockResolvedValue({
        id: requestId,
        touristId: touristId,
        guideId: 'guide-123',
        status: GuideRequestStatus.PENDING,
        conversation: null,
      });

      mockPrismaTx.guideRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaTx.notification.create.mockResolvedValue({});

      const result = await service.cancel(touristId, requestId, {
        reason: 'Change of plans',
      });

      expect(result.data.status).toBe(GuideRequestStatus.CANCELLED);
      expect(result.data.conversationStatus).toBeNull();
      expect(mockPrismaTx.guideRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: GuideRequestStatus.CANCELLED,
            cancelledAt: expect.any(Date),
            cancellationReason: 'Change of plans',
          }),
        }),
      );
    });
  });
});
