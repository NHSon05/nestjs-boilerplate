import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AiConversationStatus, AiMessageRole, AiProvider } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AiAssistantService } from './ai-assistant.service';
import { PrismaService } from 'src/database/prisma.service';
import { GeminiProvider } from './providers/gemini.provider';

describe('AiAssistantService', () => {
  let service: AiAssistantService;

  const mockPrismaService = {
    aiConversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    aiMessage: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) =>
      cb({
        aiMessage: {
          create: jest.fn().mockResolvedValue({
            id: 'assistant-msg-1',
            role: AiMessageRole.ASSISTANT,
            content: 'Chào bạn, tôi có thể giúp gì cho bạn?',
          }),
        },
        aiConversation: {
          update: jest.fn(),
        },
      }),
    ),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
      if (key === 'AI_MAX_HISTORY_MESSAGES') return '20';
      return null;
    }),
  };

  const mockGeminiProvider = {
    generateResponse: jest.fn(),
  };

  const userId = 'user-uuid-123';
  const conversationId = 'ai-conv-uuid-456';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GeminiProvider, useValue: mockGeminiProvider },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
  });

  describe('createConversation', () => {
    it('Tạo cuộc trò chuyện AI thành công', async () => {
      const dto = { title: 'Tư vấn du lịch Huế' };
      const createdConv = {
        id: conversationId,
        userId,
        title: dto.title,
        status: AiConversationStatus.ACTIVE,
        provider: AiProvider.GEMINI,
        model: 'gemini-2.5-flash',
        createdAt: new Date(),
      };

      mockPrismaService.aiConversation.create.mockResolvedValue(createdConv);

      const result = await service.createConversation(userId, dto);

      expect(result.message).toBe('Đã tạo cuộc trò chuyện AI');
      expect(result.data).toEqual(createdConv);
      expect(mockPrismaService.aiConversation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          title: dto.title,
          provider: AiProvider.GEMINI,
        }),
        select: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('Lấy danh sách cuộc trò chuyện AI kèm tin nhắn cuối', async () => {
      const mockConversations = [
        {
          id: conversationId,
          userId,
          title: 'Lịch trình Hà Nội',
          status: AiConversationStatus.ACTIVE,
          messages: [
            {
              id: 'msg-1',
              role: AiMessageRole.ASSISTANT,
              content: 'Dạ đây là lịch trình',
              createdAt: new Date(),
            },
          ],
        },
      ];

      mockPrismaService.aiConversation.findMany.mockResolvedValue(mockConversations);
      mockPrismaService.aiConversation.count.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].lastMessage).toBeDefined();
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('Lấy chi tiết cuộc trò chuyện AI thành công', async () => {
      const mockConv = {
        id: conversationId,
        userId,
        title: 'Tư vấn Huế',
        deletedAt: null,
      };

      mockPrismaService.aiConversation.findUnique.mockResolvedValue(mockConv);

      const result = await service.findOne(userId, conversationId);

      expect(result.data).toEqual(mockConv);
    });

    it('Ném NotFoundException khi cuộc trò chuyện không tồn tại', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Ném ForbiddenException khi người dùng không phải chủ sở hữu', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId: 'other-user',
        deletedAt: null,
      });

      await expect(service.findOne(userId, conversationId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getMessages', () => {
    it('Lấy danh sách tin nhắn AI phân trang cursor thành công', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        deletedAt: null,
      });

      const mockMessages = [
        {
          id: 'msg-2',
          conversationId,
          role: AiMessageRole.ASSISTANT,
          content: 'Xin chào!',
        },
        {
          id: 'msg-1',
          conversationId,
          role: AiMessageRole.USER,
          content: 'Chào bạn',
        },
      ];

      mockPrismaService.aiMessage.findMany.mockResolvedValue(mockMessages);

      const result = await service.getMessages(userId, conversationId, { limit: 30 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('Gửi tin nhắn cho AI và nhận câu trả lời thành công', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        status: AiConversationStatus.ACTIVE,
        model: 'gemini-2.5-flash',
        deletedAt: null,
      });

      mockPrismaService.aiMessage.findMany.mockResolvedValue([]);
      mockPrismaService.aiMessage.create.mockResolvedValue({
        id: 'user-msg-1',
        conversationId,
        role: AiMessageRole.USER,
        content: 'Gợi ý món ăn ở Đà Nẵng',
      });

      mockGeminiProvider.generateResponse.mockResolvedValue({
        content: 'Bạn nên thử Mì Quảng, Bánh tráng thịt heo.',
        model: 'gemini-2.5-flash',
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
        finishReason: 'STOP',
      });

      const result = await service.sendMessage(userId, conversationId, {
        content: 'Gợi ý món ăn ở Đà Nẵng',
      });

      expect(result.message).toBe('AI đã trả lời');
      expect(result.data.userMessage).toBeDefined();
      expect(result.data.assistantMessage).toBeDefined();
    });

    it('Từ chối gửi tin nhắn khi cuộc trò chuyện không còn ACTIVE', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        status: AiConversationStatus.ARCHIVED,
        deletedAt: null,
      });

      await expect(
        service.sendMessage(userId, conversationId, { content: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateConversation', () => {
    it('Đổi tên cuộc trò chuyện AI thành công', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        deletedAt: null,
      });

      const updatedConv = {
        id: conversationId,
        userId,
        title: 'Tên mới đã cập nhật',
        status: AiConversationStatus.ACTIVE,
      };

      mockPrismaService.aiConversation.update.mockResolvedValue(updatedConv);

      const result = await service.updateConversation(userId, conversationId, {
        title: 'Tên mới đã cập nhật',
      });

      expect(result.message).toBe('Cập nhật cuộc trò chuyện AI thành công');
      expect(result.data.title).toBe('Tên mới đã cập nhật');
    });
  });

  describe('removeConversation', () => {
    it('Xóa mềm cuộc trò chuyện AI thành công', async () => {
      mockPrismaService.aiConversation.findUnique.mockResolvedValue({
        id: conversationId,
        userId,
        deletedAt: null,
      });

      mockPrismaService.aiConversation.update.mockResolvedValue({
        id: conversationId,
        status: AiConversationStatus.DELETED,
        deletedAt: new Date(),
      });

      const result = await service.removeConversation(userId, conversationId);

      expect(result.message).toBe('Đã xóa cuộc trò chuyện AI');
      expect(result.data.id).toBe(conversationId);
    });
  });
});
