import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-123',
    email: 'user@example.com',
    role: 'TOURIST',
  };

  const mockNotificationsService = {
    findAll: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
    remove: jest.fn(),
    registerDeviceToken: jest.fn(),
    removeDeviceToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('findAll', () => {
    it('gọi notificationsService.findAll với đúng tham số', async () => {
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, unreadCount: 0 },
      };

      mockNotificationsService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(expected);
    });
  });

  describe('markAllAsRead', () => {
    it('gọi notificationsService.markAllAsRead', async () => {
      const expected = {
        message: 'Đã đánh dấu tất cả thông báo là đã đọc',
        data: { updatedCount: 3 },
      };

      mockNotificationsService.markAllAsRead.mockResolvedValue(expected);

      const result = await controller.markAllAsRead(mockUser);

      expect(service.markAllAsRead).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(expected);
    });
  });

  describe('registerDeviceToken', () => {
    it('gọi notificationsService.registerDeviceToken với đúng dto', async () => {
      const dto = { token: 'fcm-token-123', deviceType: 'ANDROID' };
      const expected = { message: 'Đăng ký Device Token thành công', data: {} };

      mockNotificationsService.registerDeviceToken.mockResolvedValue(expected);

      const result = await controller.registerDeviceToken(mockUser, dto);

      expect(service.registerDeviceToken).toHaveBeenCalledWith(
        mockUser.id,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('removeDeviceToken', () => {
    it('gọi notificationsService.removeDeviceToken với đúng dto', async () => {
      const dto = { token: 'fcm-token-123' };
      const expected = { message: 'Đã hủy đăng ký Device Token', data: {} };

      mockNotificationsService.removeDeviceToken.mockResolvedValue(expected);

      const result = await controller.removeDeviceToken(mockUser, dto);

      expect(service.removeDeviceToken).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });
});
