import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AttachmentType,
  ConversationStatus,
  MessageType,
} from '@prisma/client';
import { MessagesService } from './messages.service';
import { PrismaService } from 'src/database/prisma.service';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockPrismaTx = {
    message: {
      create: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  };

  const mockPrismaService = {
    conversationMember: {
      findUnique: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb: (tx: typeof mockPrismaTx) => Promise<any>) =>
      cb(mockPrismaTx),
    ),
  };

  const currentUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const conversationId = 'conv-uuid-123';
  const messageId = 'msg-uuid-456';
  const clientMsgId = 'cf782852-b682-4c52-82cc-e46535444648';

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('findByConversation', () => {
    it('UT-MSG-01: findByConversation: Lấy danh sách tin nhắn thành công', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
      });

      const mockMessages = [
        {
          id: messageId,
          conversationId,
          senderId: currentUserId,
          type: MessageType.TEXT,
          content: 'Xin chào',
          clientMessageId: clientMsgId,
          replyToId: null,
          sentAt: new Date('2026-08-05T10:00:00.000Z'),
          editedAt: null,
          deletedAt: null,
          sender: { id: currentUserId, fullName: 'Tourist', avatarUrl: null },
          replyTo: null,
          attachments: [],
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.findByConversation(currentUserId, conversationId, {
        limit: 20,
      });

      expect(mockPrismaService.conversationMember.findUnique).toHaveBeenCalledWith({
        where: {
          conversationId_userId: {
            conversationId,
            userId: currentUserId,
          },
        },
        select: expect.any(Object),
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toBe('Xin chào');
      expect(result.pagination.hasMore).toBe(false);
    });

    it('UT-MSG-02: findByConversation: Hiển thị tin nhắn bị xóa mềm với content = null', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
      });

      const mockMessages = [
        {
          id: messageId,
          conversationId,
          senderId: currentUserId,
          type: MessageType.TEXT,
          content: 'Nội dung cũ',
          clientMessageId: null,
          replyToId: null,
          sentAt: new Date(),
          editedAt: null,
          deletedAt: new Date(),
          sender: { id: currentUserId, fullName: 'Tourist', avatarUrl: null },
          replyTo: null,
          attachments: [{ id: 'att-1', type: 'IMAGE', url: 'https://...' }],
        },
      ];

      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      const result = await service.findByConversation(currentUserId, conversationId, {
        limit: 20,
      });

      expect(result.data[0].content).toBeNull();
      expect(result.data[0].attachments).toEqual([]);
    });

    it('Ném lỗi ForbiddenException nếu user không thuộc hội thoại', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue(null);

      await expect(
        service.findByConversation(currentUserId, conversationId, { limit: 20 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    it('UT-MSG-03: create: Gửi tin nhắn Text thành công', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
        conversation: { id: conversationId, status: ConversationStatus.ACTIVE },
      });

      mockPrismaService.message.findFirst.mockResolvedValue(null);

      const createdMsg = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: MessageType.TEXT,
        content: 'Xin chào',
        clientMessageId: clientMsgId,
        replyToId: null,
        sentAt: new Date(),
        editedAt: null,
        deletedAt: null,
        sender: { id: currentUserId, fullName: 'Tourist', avatarUrl: null },
        replyTo: null,
        attachments: [],
      };

      mockPrismaTx.message.create.mockResolvedValue(createdMsg);
      mockPrismaTx.conversation.update.mockResolvedValue({});

      const result = await service.create(currentUserId, conversationId, {
        type: MessageType.TEXT,
        content: 'Xin chào',
        clientMessageId: clientMsgId,
      });

      expect(result.message).toBe('Gửi tin nhắn thành công');
      expect(result.data.content).toBe('Xin chào');
      expect(result.duplicated).toBe(false);
      expect(mockPrismaTx.conversation.update).toHaveBeenCalledWith({
        where: { id: conversationId },
        data: { lastMessageAt: expect.any(Date) },
      });
    });

    it('UT-MSG-04: create: Kiểm tra Idempotency với clientMessageId', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
        conversation: { id: conversationId, status: ConversationStatus.ACTIVE },
      });

      const existingMsg = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: MessageType.TEXT,
        content: 'Xin chào',
        clientMessageId: clientMsgId,
        replyToId: null,
        sentAt: new Date(),
        editedAt: null,
        deletedAt: null,
        sender: { id: currentUserId, fullName: 'Tourist', avatarUrl: null },
        replyTo: null,
        attachments: [],
      };

      mockPrismaService.message.findFirst.mockResolvedValue(existingMsg);

      const result = await service.create(currentUserId, conversationId, {
        type: MessageType.TEXT,
        content: 'Xin chào',
        clientMessageId: clientMsgId,
      });

      expect(result.message).toBe('Tin nhắn đã tồn tại');
      expect(result.duplicated).toBe(true);
      expect(result.data.id).toBe(messageId);
      expect(mockPrismaTx.message.create).not.toHaveBeenCalled();
    });

    it('UT-MSG-05: create: Gửi tin nhắn trả lời (replyToId)', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
        conversation: { id: conversationId, status: ConversationStatus.ACTIVE },
      });

      mockPrismaService.message.findFirst.mockResolvedValue(null);
      mockPrismaService.message.findUnique.mockResolvedValue({
        id: 'reply-target-id',
        conversationId,
      });

      const createdMsg = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: MessageType.TEXT,
        content: 'Phản hồi tin nhắn',
        replyToId: 'reply-target-id',
        sentAt: new Date(),
        sender: { id: currentUserId, fullName: 'Tourist' },
      };

      mockPrismaTx.message.create.mockResolvedValue(createdMsg);

      const result = await service.create(currentUserId, conversationId, {
        type: MessageType.TEXT,
        content: 'Phản hồi tin nhắn',
        clientMessageId: clientMsgId,
        replyToId: 'reply-target-id',
      });

      expect(result.data.replyToId).toBe('reply-target-id');
    });

    it('UT-MSG-06: create: Từ chối replyToId thuộc hội thoại khác', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
        conversation: { id: conversationId, status: ConversationStatus.ACTIVE },
      });

      mockPrismaService.message.findFirst.mockResolvedValue(null);
      mockPrismaService.message.findUnique.mockResolvedValue({
        id: 'other-target-id',
        conversationId: 'other-conv-id',
      });

      await expect(
        service.create(currentUserId, conversationId, {
          type: MessageType.TEXT,
          content: 'Phản hồi tin nhắn',
          clientMessageId: clientMsgId,
          replyToId: 'other-target-id',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('Gửi tin nhắn IMAGE thành công với attachment', async () => {
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
        conversation: { id: conversationId, status: ConversationStatus.ACTIVE },
      });

      mockPrismaService.message.findFirst.mockResolvedValue(null);

      const createdMsg = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: MessageType.IMAGE,
        content: '',
        attachments: [
          {
            id: 'att-1',
            type: AttachmentType.IMAGE,
            url: 'https://cloudinary.com/photo.jpg',
          },
        ],
      };

      mockPrismaTx.message.create.mockResolvedValue(createdMsg);

      const result = await service.create(currentUserId, conversationId, {
        type: MessageType.IMAGE,
        clientMessageId: clientMsgId,
        attachments: [
          {
            type: AttachmentType.IMAGE,
            url: 'https://cloudinary.com/photo.jpg',
          },
        ],
      });

      expect(result.data.type).toBe(MessageType.IMAGE);
    });
  });

  describe('update', () => {
    it('UT-MSG-07: update: Người gửi chỉnh sửa tin nhắn thành công', async () => {
      const mockMsg = {
        id: messageId,
        senderId: currentUserId,
        conversationId,
        type: MessageType.TEXT,
        sentAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.message.findUnique.mockResolvedValue(mockMsg);
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
      });

      const updatedMsg = {
        ...mockMsg,
        content: 'Nội dung đã sửa',
        editedAt: new Date(),
      };

      mockPrismaService.message.update.mockResolvedValue(updatedMsg);

      const result = await service.update(currentUserId, messageId, {
        content: 'Nội dung đã sửa',
      });

      expect(result.message).toBe('Cập nhật tin nhắn thành công');
      expect(result.data.content).toBe('Nội dung đã sửa');
    });

    it('UT-MSG-08: update: Từ chối người không phải người gửi sửa', async () => {
      const mockMsg = {
        id: messageId,
        senderId: otherUserId,
        conversationId,
        type: MessageType.TEXT,
        sentAt: new Date(),
        deletedAt: null,
      };

      mockPrismaService.message.findUnique.mockResolvedValue(mockMsg);

      await expect(
        service.update(currentUserId, messageId, { content: 'Sửa bậy' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('UT-MSG-09: remove: Xóa mềm tin nhắn bởi người gửi', async () => {
      const mockMsg = {
        id: messageId,
        senderId: currentUserId,
        conversationId,
        type: MessageType.TEXT,
        deletedAt: null,
      };

      mockPrismaService.message.findUnique.mockResolvedValue(mockMsg);
      mockPrismaService.conversationMember.findUnique.mockResolvedValue({
        conversationId,
        userId: currentUserId,
        leftAt: null,
      });

      const deletedMsg = {
        id: messageId,
        conversationId,
        senderId: currentUserId,
        type: MessageType.TEXT,
        content: 'Đã thu hồi tin nhắn',
        deletedAt: new Date(),
      };

      mockPrismaService.message.update.mockResolvedValue(deletedMsg);

      const result = await service.remove(currentUserId, messageId);

      expect(result.message).toBe('Đã xóa tin nhắn');
      expect((result.data as any).content).toBe('Đã thu hồi tin nhắn');
      expect(result.data.deletedAt).toBeDefined();
    });
  });
});
