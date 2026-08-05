import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationStatus, ConversationType } from '@prisma/client';
import { ConversationsService } from './conversations.service';
import { PrismaService } from 'src/database/prisma.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  const mockPrismaService = {
    conversation: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    conversationMember: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
  };

  const currentUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const conversationId = 'conv-uuid-123';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  describe('findAll', () => {
    it('1. Lấy danh sách - Trả về danh sách cuộc hội thoại với phân trang chuẩn', async () => {
      const mockConversations = [
        {
          id: conversationId,
          type: ConversationType.GUIDE_REQUEST,
          status: ConversationStatus.ACTIVE,
          guideRequestId: 'req-123',
          lastMessageAt: new Date('2026-08-05T10:00:00.000Z'),
          createdAt: new Date('2026-08-01T08:00:00.000Z'),
          updatedAt: new Date('2026-08-05T10:00:00.000Z'),
          guideRequest: {
            id: 'req-123',
            title: 'Tour Phố Cổ',
            status: 'ACCEPTED',
            startAt: new Date(),
            endAt: new Date(),
            meetingAddress: 'Hà Nội',
          },
          members: [
            {
              userId: currentUserId,
              joinedAt: new Date(),
              lastReadAt: new Date(),
              user: {
                id: currentUserId,
                fullName: 'Tourist User',
                avatarUrl: null,
              },
            },
            {
              userId: otherUserId,
              joinedAt: new Date(),
              lastReadAt: new Date(),
              user: {
                id: otherUserId,
                fullName: 'Nguyen Van Guide',
                avatarUrl: 'https://example.com/avatar.jpg',
              },
            },
          ],
          messages: [
            {
              id: 'msg-1',
              senderId: otherUserId,
              type: 'TEXT',
              content: 'Xin chào!',
              sentAt: new Date('2026-08-05T10:00:00.000Z'),
              deletedAt: null,
            },
          ],
        },
      ];

      mockPrismaService.conversation.findMany.mockResolvedValue(mockConversations);
      mockPrismaService.conversation.count.mockResolvedValue(1);
      mockPrismaService.message.count.mockResolvedValue(2);

      const result = await service.findAll(currentUserId, { page: 1, limit: 20 });

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(conversationId);
      expect(result.data[0].otherUser?.fullName).toBe('Nguyen Van Guide');
      expect(result.data[0].lastMessage?.content).toBe('Xin chào!');
      expect(result.data[0].unreadCount).toBe(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('2. Lọc trạng thái - Lấy danh sách có filter status=ACTIVE', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.conversation.count.mockResolvedValue(0);

      await service.findAll(currentUserId, {
        status: ConversationStatus.ACTIVE,
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: ConversationStatus.ACTIVE,
            members: {
              some: {
                userId: currentUserId,
                leftAt: null,
              },
            },
          }),
        }),
      );
    });

    it('3. Tìm theo tên - Lọc danh sách theo keyword tên người đối phương', async () => {
      mockPrismaService.conversation.findMany.mockResolvedValue([]);
      mockPrismaService.conversation.count.mockResolvedValue(0);

      await service.findAll(currentUserId, {
        keyword: 'Nguyen',
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            members: expect.objectContaining({
              some: expect.objectContaining({
                userId: { not: currentUserId },
                user: {
                  fullName: {
                    contains: 'Nguyen',
                    mode: 'insensitive',
                  },
                },
              }),
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('4. Chi tiết - Trả về thông tin chi tiết cuộc hội thoại thành công', async () => {
      const mockConversation = {
        id: conversationId,
        type: ConversationType.GUIDE_REQUEST,
        status: ConversationStatus.ACTIVE,
        guideRequestId: 'req-123',
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        guideRequest: {
          id: 'req-123',
          title: 'Tour Phố Cổ',
          description: 'Mô tả tour',
          status: 'ACCEPTED',
          startAt: new Date(),
          endAt: new Date(),
          meetingAddress: 'Hà Nội',
          meetingLatitude: 21.02,
          meetingLongitude: 105.85,
          proposedPrice: 500000,
          currency: 'VND',
        },
        members: [
          {
            userId: currentUserId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            isMuted: false,
            user: { id: currentUserId, fullName: 'Tourist', avatarUrl: null, status: 'ACTIVE' },
          },
          {
            userId: otherUserId,
            joinedAt: new Date(),
            lastReadAt: new Date(),
            isMuted: false,
            user: { id: otherUserId, fullName: 'Nguyen Guide', avatarUrl: null, status: 'ACTIVE' },
          },
        ],
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await service.findOne(currentUserId, conversationId);

      expect(result.data.id).toBe(conversationId);
      expect(result.data.otherUser?.fullName).toBe('Nguyen Guide');
      expect(result.data.currentMember).toBeDefined();
    });

    it('4. Chi tiết - Ném lỗi NotFoundException khi cuộc hội thoại không tồn tại', async () => {
      mockPrismaService.conversation.findUnique.mockResolvedValue(null);

      await expect(service.findOne(currentUserId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('4. Chi tiết - Ném lỗi ForbiddenException khi user không phải thành viên', async () => {
      const mockConversation = {
        id: conversationId,
        members: [
          { userId: 'other-user-1', user: {} },
          { userId: 'other-user-2', user: {} },
        ],
      };

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.findOne(currentUserId, conversationId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('markAsRead', () => {
    it('5. Đánh dấu đã đọc - Cập nhật lastReadAt thành công', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
      });

      const mockUpdated = {
        conversationId,
        userId: currentUserId,
        lastReadAt: new Date(),
      };
      mockPrismaService.conversationMember.update.mockResolvedValue(mockUpdated);

      const result = await service.markAsRead(currentUserId, conversationId);

      expect(result.message).toBe('Đã đánh dấu cuộc trò chuyện là đã đọc');
      expect(result.data.lastReadAt).toBeDefined();
      expect(mockPrismaService.conversationMember.update).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        data: {
          lastReadAt: expect.any(Date),
        },
        select: {
          conversationId: true,
          userId: true,
          lastReadAt: true,
        },
      });
    });

    it('5. Đánh dấu đã đọc - Ném ForbiddenException nếu người dùng không thuộc hội thoại', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(currentUserId, conversationId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
