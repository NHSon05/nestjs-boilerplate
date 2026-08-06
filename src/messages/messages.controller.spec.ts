import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessageType } from '@prisma/client';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-1',
    email: 'user@example.com',
    role: 'TOURIST',
  };

  const mockMessagesService = {
    findByConversation: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  describe('findByConversation', () => {
    it('gọi messagesService.findByConversation với đúng tham số', async () => {
      const conversationId = 'conv-123';
      const query = { limit: 20 };
      const expected = {
        data: [],
        pagination: { nextCursor: null, hasMore: false, limit: 20 },
      };

      mockMessagesService.findByConversation.mockResolvedValue(expected);

      const result = await controller.findByConversation(
        mockUser,
        conversationId,
        query,
      );

      expect(service.findByConversation).toHaveBeenCalledWith(
        mockUser.id,
        conversationId,
        query,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('create', () => {
    it('gọi messagesService.create với đúng dto', async () => {
      const conversationId = 'conv-123';
      const dto = {
        type: MessageType.TEXT,
        content: 'Hello',
        clientMessageId: 'cf782852-b682-4c52-82cc-e46535444648',
      };
      const expected = {
        message: 'Gửi tin nhắn thành công',
        data: {},
        duplicated: false,
      };

      mockMessagesService.create.mockResolvedValue(expected);

      const result = await controller.create(mockUser, conversationId, dto);

      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        conversationId,
        dto,
      );
      expect(result).toEqual(expected);
    });
  });

  describe('update', () => {
    it('gọi messagesService.update với đúng messageId và content', async () => {
      const messageId = 'msg-123';
      const dto = { content: 'Sửa tin nhắn' };
      const expected = { message: 'Cập nhật tin nhắn thành công', data: {} };

      mockMessagesService.update.mockResolvedValue(expected);

      const result = await controller.update(mockUser, messageId, dto);

      expect(service.update).toHaveBeenCalledWith(mockUser.id, messageId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('remove', () => {
    it('gọi messagesService.remove với đúng messageId', async () => {
      const messageId = 'msg-123';
      const expected = { message: 'Đã xóa tin nhắn', data: {} };

      mockMessagesService.remove.mockResolvedValue(expected);

      const result = await controller.remove(mockUser, messageId);

      expect(service.remove).toHaveBeenCalledWith(mockUser.id, messageId);
      expect(result).toEqual(expected);
    });
  });
});
