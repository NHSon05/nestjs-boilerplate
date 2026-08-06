import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PrismaService } from 'src/database/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    deviceToken: {
      upsert: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockNotificationsGateway = {
    emitNotification: jest.fn(),
    emitNotificationRead: jest.fn(),
    emitAllRead: jest.fn(),
    emitUnreadCount: jest.fn(),
  };

  const mockFirebaseAdminService = {
    sendMulticastPush: jest.fn(),
  };

  const userId = 'user-uuid-123';
  const notificationId = 'noti-uuid-456';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsGateway, useValue: mockNotificationsGateway },
        { provide: FirebaseAdminService, useValue: mockFirebaseAdminService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('Lấy danh sách thông báo và đếm unreadCount thành công', async () => {
      const mockNotifications = [
        {
          id: notificationId,
          userId,
          type: NotificationType.GUIDE_REQUEST_RECEIVED,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.DELIVERED,
          title: 'Yêu cầu mới',
          body: 'Tourist đã gửi yêu cầu',
          data: { requestId: 'req-1' },
          readAt: null,
          deliveredAt: new Date(),
          createdAt: new Date(),
        },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );
      mockPrismaService.notification.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(1);

      const result = await service.findAll(userId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('Đánh dấu 1 thông báo là đã đọc thành công', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue({
        id: notificationId,
        userId,
        readAt: null,
        deletedAt: null,
      });

      const updated = {
        id: notificationId,
        userId,
        type: NotificationType.GUIDE_REQUEST_RECEIVED,
        readAt: new Date(),
      };

      mockPrismaService.notification.update.mockResolvedValue(updated);
      mockPrismaService.notification.count.mockResolvedValue(0);

      const result = await service.markAsRead(userId, notificationId);

      expect(result.message).toBe('Đã đánh dấu thông báo là đã đọc');
      expect(mockNotificationsGateway.emitNotificationRead).toHaveBeenCalled();
    });

    it('Ném NotFoundException khi thông báo không tồn tại', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(userId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('Đánh dấu tất cả thông báo là đã đọc', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead(userId);

      expect(result.data.updatedCount).toBe(5);
      expect(mockNotificationsGateway.emitAllRead).toHaveBeenCalled();
    });
  });

  describe('registerDeviceToken', () => {
    it('Đăng ký FCM Device Token thành công', async () => {
      const dto = { token: 'fcm-token-123', deviceType: 'ANDROID' };
      mockPrismaService.deviceToken.upsert.mockResolvedValue({
        id: 'dt-1',
        userId,
        ...dto,
        isActive: true,
      });

      const result = await service.registerDeviceToken(userId, dto);

      expect(result.message).toBe('Đăng ký Device Token thành công');
      expect(mockPrismaService.deviceToken.upsert).toHaveBeenCalled();
    });
  });

  describe('removeDeviceToken', () => {
    it('Hủy đăng ký FCM Device Token thành công', async () => {
      const dto = { token: 'fcm-token-123' };
      mockPrismaService.deviceToken.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.removeDeviceToken(userId, dto);

      expect(result.message).toBe('Đã hủy đăng ký Device Token');
    });
  });

  describe('sendNotification', () => {
    it('Gửi thông báo hợp nhất (DB -> In-App WS -> FCM Push)', async () => {
      const payload = {
        userId,
        type: NotificationType.GUIDE_REQUEST_ACCEPTED,
        title: 'Chấp nhận yêu cầu',
        body: 'Guide đã chấp nhận yêu cầu của bạn',
        data: { guideRequestId: 'req-1' },
      };

      const createdNoti = {
        id: notificationId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        ...payload,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(createdNoti);
      mockPrismaService.notification.count.mockResolvedValue(1);
      mockPrismaService.deviceToken.findMany.mockResolvedValue([
        { token: 'fcm-token-1' },
      ]);
      mockFirebaseAdminService.sendMulticastPush.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        failedTokens: [],
      });

      const result = await service.sendNotification(payload);

      expect(result.title).toBe(payload.title);
      expect(mockNotificationsGateway.emitNotification).toHaveBeenCalled();
      expect(mockFirebaseAdminService.sendMulticastPush).toHaveBeenCalledWith(
        ['fcm-token-1'],
        expect.objectContaining({ title: payload.title }),
      );
    });
  });
});
