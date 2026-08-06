import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';

describe('AiAssistantController', () => {
  let controller: AiAssistantController;
  let service: AiAssistantService;

  const mockUser: AuthenticatedUser = {
    id: 'user-uuid-123',
    email: 'user@example.com',
    role: 'TOURIST' as any,
  };

  const mockAiAssistantService = {
    createConversation: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
    updateConversation: jest.fn(),
    removeConversation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiAssistantController],
      providers: [
        {
          provide: AiAssistantService,
          useValue: mockAiAssistantService,
        },
      ],
    }).compile();

    controller = module.get<AiAssistantController>(AiAssistantController);
    service = module.get<AiAssistantService>(AiAssistantService);
  });

  describe('createConversation', () => {
    it('gọi aiAssistantService.createConversation với đúng dto', async () => {
      const dto = { title: 'Tư vấn Hà Nội' };
      const expected = { message: 'Đã tạo cuộc trò chuyện AI', data: { id: 'ai-conv-1' } };

      mockAiAssistantService.createConversation.mockResolvedValue(expected);

      const result = await controller.createConversation(mockUser, dto);

      expect(service.createConversation).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('findAll', () => {
    it('gọi aiAssistantService.findAll với đúng query', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };

      mockAiAssistantService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(mockUser, query);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.id, query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('gọi aiAssistantService.findOne với đúng conversationId', async () => {
      const conversationId = 'ai-conv-123';
      const expected = { data: { id: conversationId } };

      mockAiAssistantService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(mockUser, conversationId);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, conversationId);
      expect(result).toEqual(expected);
    });
  });

  describe('getMessages', () => {
    it('gọi aiAssistantService.getMessages với đúng conversationId và query', async () => {
      const conversationId = 'ai-conv-123';
      const query = { limit: 30 };
      const expected = { data: [], pagination: { nextCursor: null, hasMore: false, limit: 30 } };

      mockAiAssistantService.getMessages.mockResolvedValue(expected);

      const result = await controller.getMessages(mockUser, conversationId, query);

      expect(service.getMessages).toHaveBeenCalledWith(mockUser.id, conversationId, query);
      expect(result).toEqual(expected);
    });
  });

  describe('sendMessage', () => {
    it('gọi aiAssistantService.sendMessage với đúng conversationId và dto', async () => {
      const conversationId = 'ai-conv-123';
      const dto = { content: 'Gợi ý lịch trình 3 ngày ở Đà Nẵng' };
      const expected = { message: 'AI đã trả lời', data: {} };

      mockAiAssistantService.sendMessage.mockResolvedValue(expected);

      const result = await controller.sendMessage(mockUser, conversationId, dto);

      expect(service.sendMessage).toHaveBeenCalledWith(mockUser.id, conversationId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('updateConversation', () => {
    it('gọi aiAssistantService.updateConversation với đúng dto', async () => {
      const conversationId = 'ai-conv-123';
      const dto = { title: 'Tên mới' };
      const expected = { message: 'Cập nhật cuộc trò chuyện AI thành công', data: {} };

      mockAiAssistantService.updateConversation.mockResolvedValue(expected);

      const result = await controller.updateConversation(mockUser, conversationId, dto);

      expect(service.updateConversation).toHaveBeenCalledWith(mockUser.id, conversationId, dto);
      expect(result).toEqual(expected);
    });
  });

  describe('removeConversation', () => {
    it('gọi aiAssistantService.removeConversation với đúng conversationId', async () => {
      const conversationId = 'ai-conv-123';
      const expected = { message: 'Đã xóa cuộc trò chuyện AI', data: { id: conversationId } };

      mockAiAssistantService.removeConversation.mockResolvedValue(expected);

      const result = await controller.removeConversation(mockUser, conversationId);

      expect(service.removeConversation).toHaveBeenCalledWith(mockUser.id, conversationId);
      expect(result).toEqual(expected);
    });
  });
});
