import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { GetConversationsDto } from './dto/get-conversations.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUserId: string, query: GetConversationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const keyword = query.keyword?.trim();

    const where: Prisma.ConversationWhereInput = {
      status: query.status,

      members: {
        some: {
          userId: currentUserId,
          leftAt: null,
        },
      },

      ...(keyword
        ? {
            members: {
              some: {
                userId: {
                  not: currentUserId,
                },
                leftAt: null,
                user: {
                  fullName: {
                    contains: keyword,
                    mode: 'insensitive',
                  },
                },
              },
            },
          }
        : {}),
    };

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,

        orderBy: [
          {
            lastMessageAt: {
              sort: 'desc',
              nulls: 'last',
            },
          },
          {
            updatedAt: 'desc',
          },
        ],

        select: {
          id: true,
          type: true,
          status: true,
          guideRequestId: true,
          lastMessageAt: true,
          createdAt: true,
          updatedAt: true,

          guideRequest: {
            select: {
              id: true,
              title: true,
              status: true,
              startAt: true,
              endAt: true,
              meetingAddress: true,
            },
          },

          members: {
            where: {
              leftAt: null,
            },
            select: {
              userId: true,
              joinedAt: true,
              lastReadAt: true,

              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
            },
          },

          messages: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              sentAt: 'desc',
            },
            take: 1,
            select: {
              id: true,
              senderId: true,
              type: true,
              content: true,
              sentAt: true,
              deletedAt: true,
            },
          },
        },
      }),

      this.prisma.conversation.count({
        where,
      }),
    ]);

    const data = await Promise.all(
      conversations.map(async (conversation) => {
        const currentMember = conversation.members.find(
          (member) => member.userId === currentUserId,
        );

        const otherMember = conversation.members.find(
          (member) => member.userId !== currentUserId,
        );

        const unreadSince =
          currentMember?.lastReadAt ??
          currentMember?.joinedAt ??
          conversation.createdAt;

        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: {
              not: currentUserId,
            },
            deletedAt: null,
            sentAt: {
              gt: unreadSince,
            },
          },
        });

        return {
          id: conversation.id,
          type: conversation.type,
          status: conversation.status,
          lastMessageAt: conversation.lastMessageAt,

          otherUser: otherMember?.user ?? null,

          guideRequest: conversation.guideRequest,

          lastMessage: conversation.messages[0] ?? null,

          unreadCount,

          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
      }),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(currentUserId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },

      select: {
        id: true,
        type: true,
        status: true,
        guideRequestId: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,

        guideRequest: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            startAt: true,
            endAt: true,
            meetingAddress: true,
            meetingLatitude: true,
            meetingLongitude: true,
            proposedPrice: true,
            currency: true,
          },
        },

        members: {
          where: {
            leftAt: null,
          },

          select: {
            userId: true,
            joinedAt: true,
            lastReadAt: true,
            isMuted: true,

            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    }

    const currentMember = conversation.members.find(
      (member) => member.userId === currentUserId,
    );

    if (!currentMember) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const otherMember = conversation.members.find(
      (member) => member.userId !== currentUserId,
    );

    return {
      data: {
        id: conversation.id,
        type: conversation.type,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,

        currentMember: {
          joinedAt: currentMember.joinedAt,
          lastReadAt: currentMember.lastReadAt,
          isMuted: currentMember.isMuted,
        },

        otherUser: otherMember?.user ?? null,

        guideRequest: conversation.guideRequest,

        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    };
  }

  async markAsRead(currentUserId: string, conversationId: string) {
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
        leftAt: true,
      },
    });

    if (!member || member.leftAt) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    const lastReadAt = new Date();

    const updatedMember = await this.prisma.conversationMember.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },

      data: {
        lastReadAt,
      },

      select: {
        conversationId: true,
        userId: true,
        lastReadAt: true,
      },
    });

    return {
      message: 'Đã đánh dấu cuộc trò chuyện là đã đọc',
      data: updatedMember,
    };
  }

  async assertActiveMember(currentUserId: string, conversationId: string) {
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
        leftAt: true,

        conversation: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!member || member.leftAt) {
      throw new ForbiddenException('Bạn không thuộc cuộc trò chuyện này');
    }

    return member;
  }
}
