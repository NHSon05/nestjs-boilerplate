import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttachmentType,
  ConversationStatus,
  MessageType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByConversation(
    currentUserId: string,
    conversationId: string,
    query: GetMessagesDto,
  ) {
    await this.assertActiveMember(currentUserId, conversationId);

    const limit = query.limit ?? 30;

    const where: Prisma.MessageWhereInput = {
      conversationId,

      ...(query.before && !query.cursor
        ? {
            sentAt: {
              lt: new Date(query.before),
            },
          }
        : {}),
    };

    const messages = await this.prisma.message.findMany({
      where,

      take: limit + 1,

      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },
            skip: 1,
          }
        : {}),

      orderBy: [
        {
          sentAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        type: true,
        content: true,
        clientMessageId: true,
        replyToId: true,
        sentAt: true,
        editedAt: true,
        deletedAt: true,

        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },

        replyTo: {
          select: {
            id: true,
            senderId: true,
            type: true,
            content: true,
            deletedAt: true,

            sender: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },

        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            publicId: true,
            fileName: true,
            mimeType: true,
            fileSize: true,
            width: true,
            height: true,
            duration: true,
            createdAt: true,
          },
        },
      },
    });

    const hasMore = messages.length > limit;

    const pageItems = hasMore ? messages.slice(0, limit) : messages;

    const nextCursor =
      pageItems.length > 0 ? pageItems[pageItems.length - 1].id : null;

    /*
     * Prisma trả newest -> oldest.
     * Đảo lại để frontend nhận oldest -> newest.
     */
    const data = pageItems.reverse().map((message) => {
      if (!message.deletedAt) {
        return message;
      }

      return {
        ...message,
        content: null,
        attachments: [],
      };
    });

    return {
      data,
      pagination: {
        nextCursor,
        hasMore,
        limit,
      },
    };
  }

  async create(
    currentUserId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ) {
    const membership = await this.assertActiveMember(
      currentUserId,
      conversationId,
    );

    if (membership.conversation.status !== ConversationStatus.ACTIVE) {
      throw new ConflictException('Cuộc trò chuyện đã đóng');
    }

    this.validateMessagePayload(dto);

    const existingMessage = await this.prisma.message.findFirst({
      where: {
        senderId: currentUserId,
        clientMessageId: dto.clientMessageId,
      },

      select: this.messageSelect(),
    });

    if (existingMessage) {
      if (existingMessage.conversationId !== conversationId) {
        throw new ConflictException('clientMessageId đã được sử dụng');
      }

      return {
        message: 'Tin nhắn đã tồn tại',
        data: existingMessage,
        duplicated: true,
      };
    }

    if (dto.replyToId) {
      const replyTarget = await this.prisma.message.findUnique({
        where: {
          id: dto.replyToId,
        },

        select: {
          id: true,
          conversationId: true,
        },
      });

      if (!replyTarget) {
        throw new NotFoundException('Không tìm thấy tin nhắn được trả lời');
      }

      if (replyTarget.conversationId !== conversationId) {
        throw new BadRequestException(
          'Không thể trả lời tin nhắn thuộc cuộc trò chuyện khác',
        );
      }
    }

    const sentAt = new Date();

    try {
      const createdMessage = await this.prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId,
            senderId: currentUserId,
            type: dto.type,
            content: dto.content?.trim() ?? '',
            clientMessageId: dto.clientMessageId,
            replyToId: dto.replyToId,

            attachments: dto.attachments?.length
              ? {
                  create: dto.attachments.map((attachment) => ({
                    type: attachment.type,
                    url: attachment.url,
                    publicId: attachment.publicId,
                    fileName: attachment.fileName,
                    mimeType: attachment.mimeType,
                    fileSize: attachment.fileSize,
                    width: attachment.width,
                    height: attachment.height,
                    duration: attachment.duration,
                  })),
                }
              : undefined,
          },

          select: this.messageSelect(),
        });

        await tx.conversation.update({
          where: {
            id: conversationId,
          },

          data: {
            lastMessageAt: sentAt,
          },
        });

        return message;
      });

      const otherMember = membership.conversation.members?.find(
        (m) => m.userId !== currentUserId,
      );

      if (otherMember) {
        await this.notificationsService.sendNotification({
          userId: otherMember.userId,
          type: NotificationType.MESSAGE_RECEIVED,
          title: 'Tin nhắn mới',
          body: `${createdMessage.sender.fullName}: ${
            createdMessage.type === MessageType.TEXT
              ? createdMessage.content
              : '[Tệp đính kèm]'
          }`,
          data: {
            conversationId,
            messageId: createdMessage.id,
          },
        });
      }

      return {
        message: 'Gửi tin nhắn thành công',
        data: createdMessage,
        duplicated: false,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const duplicatedMessage = await this.prisma.message.findFirst({
          where: {
            senderId: currentUserId,
            clientMessageId: dto.clientMessageId,
          },

          select: this.messageSelect(),
        });

        if (duplicatedMessage) {
          return {
            message: 'Tin nhắn đã tồn tại',
            data: duplicatedMessage,
            duplicated: true,
          };
        }
      }

      throw error;
    }
  }

  async update(
    currentUserId: string,
    messageId: string,
    dto: UpdateMessageDto,
  ) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,
        senderId: true,
        conversationId: true,
        type: true,
        sentAt: true,
        deletedAt: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa tin nhắn này');
    }

    if (message.deletedAt) {
      throw new ConflictException('Tin nhắn đã bị xóa');
    }

    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Chỉ có thể chỉnh sửa tin nhắn văn bản');
    }

    await this.assertActiveMember(currentUserId, message.conversationId);

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Nội dung tin nhắn không được để trống');
    }

    /*
     * Tùy chọn: chỉ cho sửa trong 15 phút.
     */
    const editDeadline = message.sentAt.getTime() + 15 * 60 * 1000;

    if (Date.now() > editDeadline) {
      throw new ConflictException('Đã hết thời gian chỉnh sửa tin nhắn');
    }

    const updatedMessage = await this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        content,
        editedAt: new Date(),
      },

      select: this.messageSelect(),
    });

    return {
      message: 'Cập nhật tin nhắn thành công',
      data: updatedMessage,
    };
  }

  async remove(currentUserId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },

      select: {
        id: true,
        senderId: true,
        conversationId: true,
        type: true,
        deletedAt: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Không tìm thấy tin nhắn');
    }

    if (message.senderId !== currentUserId) {
      throw new ForbiddenException('Bạn không có quyền xóa tin nhắn này');
    }

    await this.assertActiveMember(currentUserId, message.conversationId);

    if (message.deletedAt) {
      return {
        message: 'Tin nhắn đã được xóa trước đó',
        data: {
          id: message.id,
          deletedAt: message.deletedAt,
        },
      };
    }

    if (
      message.type === MessageType.SYSTEM ||
      message.type === MessageType.CALL
    ) {
      throw new BadRequestException('Không thể xóa tin nhắn hệ thống');
    }

    const deletedAt = new Date();

    const deletedMessage = await this.prisma.message.update({
      where: {
        id: messageId,
      },

      data: {
        content: 'Đã thu hồi tin nhắn',
        deletedAt,
      },

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        type: true,
        content: true,
        deletedAt: true,
      },
    });

    return {
      message: 'Đã xóa tin nhắn',
      data: deletedMessage,
    };
  }

  private validateMessagePayload(dto: CreateMessageDto): void {
    const content = dto.content?.trim();
    const attachments = dto.attachments ?? [];

    if (dto.type === MessageType.TEXT) {
      if (!content) {
        throw new BadRequestException('Tin nhắn văn bản phải có nội dung');
      }

      if (attachments.length > 0) {
        throw new BadRequestException(
          'Tin nhắn văn bản không được chứa attachment',
        );
      }

      return;
    }

    if (dto.type === MessageType.SYSTEM || dto.type === MessageType.CALL) {
      throw new BadRequestException(
        'Client không được tự tạo tin nhắn hệ thống',
      );
    }

    if (attachments.length === 0) {
      throw new BadRequestException('Tin nhắn dạng file phải có attachment');
    }

    const allowedAttachmentType = this.getAttachmentTypeForMessage(dto.type);

    const invalidAttachment = attachments.some(
      (attachment) => attachment.type !== allowedAttachmentType,
    );

    if (invalidAttachment) {
      throw new BadRequestException(
        'Loại attachment không phù hợp với loại message',
      );
    }
  }

  private getAttachmentTypeForMessage(
    messageType: MessageType,
  ): AttachmentType {
    const mapping: Partial<Record<MessageType, AttachmentType>> = {
      [MessageType.IMAGE]: AttachmentType.IMAGE,
      [MessageType.FILE]: AttachmentType.FILE,
      [MessageType.AUDIO]: AttachmentType.AUDIO,
      [MessageType.VIDEO]: AttachmentType.VIDEO,
    };

    const result = mapping[messageType];

    if (!result) {
      throw new BadRequestException('Loại message không hỗ trợ attachment');
    }

    return result;
  }

  private async assertActiveMember(
    currentUserId: string,
    conversationId: string,
  ) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },

      select: {
        conversationId: true,
        userId: true,
        joinedAt: true,
        leftAt: true,

        conversation: {
          select: {
            id: true,
            status: true,
            members: {
              where: {
                leftAt: null,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!member || member.leftAt) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    return member;
  }

  private messageSelect() {
    return {
      id: true,
      conversationId: true,
      senderId: true,
      type: true,
      content: true,
      clientMessageId: true,
      replyToId: true,
      sentAt: true,
      editedAt: true,
      deletedAt: true,

      sender: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },

      replyTo: {
        select: {
          id: true,
          senderId: true,
          type: true,
          content: true,
          deletedAt: true,

          sender: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      },

      attachments: {
        select: {
          id: true,
          type: true,
          url: true,
          publicId: true,
          fileName: true,
          mimeType: true,
          fileSize: true,
          width: true,
          height: true,
          duration: true,
          createdAt: true,
        },
      },
    } satisfies Prisma.MessageSelect;
  }
}
