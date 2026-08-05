import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationStatus } from '@prisma/client';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let service: ConversationsService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    role: 'TOURIST' as any,
  };

  const mockConversationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    markAsRead: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
    service = module.get<ConversationsService>(ConversationsService);
  });

  describe('findAll', () => {
    it('gọi conversationsService.findAll với đúng tham số', async () => {
      const query = { page: 1, limit: 20, status: ConversationStatus.ACTIVE, keyword: 'Nguyen' };
      const expectedResult = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      mockConversationsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('gọi conversationsService.findOne với conversationId', async () => {
      const conversationId = 'conv-uuid-123';
      const expectedResult = { data: { id: conversationId } };
      mockConversationsService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(mockUser, conversationId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, conversationId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('markAsRead', () => {
    it('gọi conversationsService.markAsRead với conversationId', async () => {
      const conversationId = 'conv-uuid-123';
      const expectedResult = { message: 'Đã đánh dấu đã đọc' };
      mockConversationsService.markAsRead.mockResolvedValue(expectedResult);

      const result = await controller.markAsRead(mockUser, conversationId);

      expect(service.markAsRead).toHaveBeenCalledWith(mockUser.id, conversationId);
      expect(result).toEqual(expectedResult);
    });
  });
});
