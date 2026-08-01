import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateGuideRequestDto } from './dto/create-guide-request.dto';
import {
  Prisma,
  UserRole,
  GuideRequestStatus,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  ConversationStatus,
} from '@prisma/client';
import { GetMyGuideRequestsDto } from './dto/get-my-guide-request.dto';
import { RejectGuideRequestDto } from './dto/reject-guide-request.dto';
import { CancelGuideRequestDto } from './dto/cancel-guide-request.dto';

@Injectable()
export class GuideRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(touristId: string, dto: CreateGuideRequestDto) {
    if (touristId === dto.guideId) {
      throw new BadRequestException(
        'Bạn không thể tự gửi request cho chính mình',
      );
    }
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Thời gian không hợp lệ');
    }

    if (endAt <= startAt) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    }
    if (startAt.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException(
        'Thời gian bắt đầu không được nằm trong quá khứ',
      );
    }
    const [tourist, guide] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: touristId },
        select: {
          id: true,
          role: true,
          status: true,
          deletedAt: true,
          fullName: true,
          touristProfile: {
            select: {
              userId: true,
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: dto.guideId },
        select: {
          id: true,
          status: true,
          deletedAt: true,
          fullName: true,
          guideProfile: {
            select: {
              userId: true,
              isAvailable: true,
              verificationStatus: true,
            },
          },
        },
      }),
    ]);
    if (!tourist || tourist.deletedAt || tourist.status !== 'ACTIVE') {
      throw new ForbiddenException('Tài khoản Tourist không hợp lệ');
    }
    if (tourist.role !== UserRole.TOURIST || !tourist.touristProfile) {
      throw new ForbiddenException('Bạn cần chuyển sang chế độ TOURIST');
    }
    if (
      !guide ||
      guide.deletedAt ||
      guide.status !== 'ACTIVE' ||
      !guide.guideProfile
    ) {
      throw new NotFoundException('Không tìm thấy hướng dẫn viên');
    }

    if (!guide.guideProfile.isAvailable) {
      throw new ConflictException('Hướng dẫn viên hiện không sẵn sàng');
    }
    const overlappingRequest = await this.prisma.guideRequest.findFirst({
      where: {
        touristId,
        guideId: dto.guideId,

        status: {
          in: [GuideRequestStatus.PENDING, GuideRequestStatus.ACCEPTED],
        },

        startAt: {
          lt: endAt,
        },

        endAt: {
          gt: startAt,
        },
      },
      select: {
        id: true,
      },
    });
    if (overlappingRequest) {
      throw new ConflictException(
        'Bạn đã có một yêu cầu đang hoạt động với Guide này trong khoảng thời gian đã chọn',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guideRequest.create({
        data: {
          touristId,
          guideId: dto.guideId,
          title: dto.title.trim(),
          description: dto.description?.trim(),
          startAt,
          endAt,
          meetingAddress: dto.meetingAddress?.trim(),
          meetingLatitude: dto.meetingLatitude,
          meetingLongitude: dto.meetingLongitude,
          proposedPrice:
            dto.proposedPrice !== undefined
              ? new Prisma.Decimal(dto.proposedPrice)
              : undefined,
          currency: dto.currency?.toUpperCase() ?? 'VND',
        },

        select: {
          id: true,
          touristId: true,
          guideId: true,
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
          createdAt: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: dto.guideId,
          type: NotificationType.GUIDE_REQUEST_RECEIVED,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          title: 'Bạn có yêu cầu hướng dẫn mới',
          body: `${tourist.fullName} đã gửi một yêu cầu hướng dẫn`,
          data: {
            guideRequestId: request.id,
            touristId,
          },
        },
      });

      return {
        message: 'Gửi yêu cầu thành công',
        data: request,
      };
    });
  }
  async findMyRequests(
    userId: string,
    query: GetMyGuideRequestsDto,
    userRole?: string,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const participantFilter: Prisma.GuideRequestWhereInput = userRole
      ? userRole === UserRole.GUIDE
        ? { guideId: userId }
        : { touristId: userId }
      : {
          OR: [{ touristId: userId }, { guideId: userId }],
        };

    const where: Prisma.GuideRequestWhereInput = {
      ...participantFilter,
      ...(query.status ? { status: query.status } : {}),
    };

    const [requests, total] = await Promise.all([
      this.prisma.guideRequest.findMany({
        where,
        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },

        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          startAt: true,
          endAt: true,
          meetingAddress: true,
          proposedPrice: true,
          currency: true,
          acceptedAt: true,
          rejectedAt: true,
          cancelledAt: true,
          createdAt: true,

          tourist: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },

          guide: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            },
          },

          conversation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),

      this.prisma.guideRequest.count({
        where,
      }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async findOne(currentUserId: string, requestId: string) {
    const request = await this.prisma.guideRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        touristId: true,
        guideId: true,
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
        acceptedAt: true,
        rejectedAt: true,
        cancelledAt: true,
        completedAt: true,
        rejectionReason: true,
        cancellationReason: true,
        createdAt: true,
        updatedAt: true,

        tourist: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },

        guide: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },

        conversation: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu');
    }
    const isParticipant =
      request.touristId === currentUserId || request.guideId === currentUserId;

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không có quyền xem yêu cầu này');
    }

    return {
      data: request,
    };
  }
  async accept(guideId: string, requestId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guideRequest.findUnique({
        where: {
          id: requestId,
        },

        select: {
          id: true,
          touristId: true,
          guideId: true,
          status: true,
          startAt: true,
          endAt: true,
          conversation: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu');
      }

      if (request.guideId !== guideId) {
        throw new ForbiddenException(
          'Bạn không có quyền chấp nhận yêu cầu này',
        );
      }

      if (request.status !== GuideRequestStatus.PENDING) {
        throw new ConflictException('Yêu cầu đã được xử lý');
      }

      if (request.conversation) {
        throw new ConflictException('Yêu cầu đã có cuộc trò chuyện');
      }

      const result = await tx.guideRequest.updateMany({
        where: {
          id: requestId,
          guideId,
          status: GuideRequestStatus.PENDING,
        },

        data: {
          status: GuideRequestStatus.ACCEPTED,
          acceptedAt: new Date(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Yêu cầu đã được xử lý bởi một thao tác khác',
        );
      }

      const conversation = await tx.conversation.create({
        data: {
          guideRequestId: request.id,
          status: ConversationStatus.ACTIVE,
          members: {
            create: [
              {
                userId: request.touristId,
              },
              {
                userId: request.guideId,
              },
            ],
          },
        },

        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.notification.create({
        data: {
          userId: request.touristId,
          type: NotificationType.GUIDE_REQUEST_ACCEPTED,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          title: 'Yêu cầu đã được chấp nhận',
          body: 'Hướng dẫn viên đã chấp nhận yêu cầu của bạn',
          data: {
            guideRequestId: request.id,
            conversationId: conversation.id,
            guideId,
          },
        },
      });

      return {
        message: 'Đã chấp nhận yêu cầu',
        data: {
          requestId: request.id,
          status: GuideRequestStatus.ACCEPTED,
          conversationId: conversation.id,
        },
      };
    });
  }

  async reject(guideId: string, requestId: string, dto: RejectGuideRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guideRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          touristId: true,
          guideId: true,
          status: true,
        },
      });
      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu');
      }
      if (request.guideId !== guideId) {
        throw new ForbiddenException('Bạn không có quyền từ chối yêu cầu này');
      }
      const result = await tx.guideRequest.updateMany({
        where: {
          id: requestId,
          guideId,
          status: GuideRequestStatus.PENDING,
        },
        data: {
          status: GuideRequestStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: dto.reason.trim(),
          version: {
            increment: 1,
          },
        },
      });
      if (result.count === 0) {
        throw new ConflictException('Yêu cầu đã được xử lý');
      }
      await tx.notification.create({
        data: {
          userId: request.touristId,
          type: NotificationType.GUIDE_REQUEST_REJECTED,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          title: 'Yêu cầu đã bị từ chối',
          body: 'Hướng dẫn viên không thể nhận yêu cầu của bạn',
          data: {
            guideRequestId: request.id,
            guideId,
            reason: dto.reason.trim(),
          },
        },
      });
      return {
        message: 'Đã từ chối yêu cầu',
        data: {
          requestId: request.id,
          status: GuideRequestStatus.REJECTED,
          rejectionReason: dto.reason.trim(),
        },
      };
    });
  }
  async cancel(
    touristId: string,
    requestId: string,
    dto: CancelGuideRequestDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.guideRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          touristId: true,
          guideId: true,
          status: true,
          conversation: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });
      if (!request) {
        throw new NotFoundException('Không tìm thấy yêu cầu');
      }
      if (request.touristId !== touristId) {
        throw new ForbiddenException('Bạn không có quyền hủy yêu cầu này');
      }
      const cancellableStatuses: GuideRequestStatus[] = [
        GuideRequestStatus.PENDING,
        GuideRequestStatus.ACCEPTED,
      ];

      if (!cancellableStatuses.includes(request.status)) {
        throw new ConflictException('Yêu cầu hiện tại không thể huỷ');
      }
      const result = await tx.guideRequest.updateMany({
        where: {
          id: requestId,
          touristId,
          status: {
            in: cancellableStatuses,
          },
        },

        data: {
          status: GuideRequestStatus.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: dto.reason?.trim(),
          version: {
            increment: 1,
          },
        },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Yêu cầu đã được xử lý bởi một thao tác khác',
        );
      }
      if (request.conversation) {
        await tx.conversation.update({
          where: {
            id: request.conversation.id,
          },

          data: {
            status: ConversationStatus.CLOSED,
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: request.guideId,
          type: NotificationType.GUIDE_REQUEST_CANCELLED,
          channel: NotificationChannel.IN_APP,
          status: NotificationStatus.PENDING,
          title: 'Yêu cầu đã bị hủy',
          body: 'Khách du lịch đã hủy yêu cầu hướng dẫn',
          data: {
            guideRequestId: request.id,
            touristId,
            reason: dto.reason?.trim() ?? null,
          },
        },
      });
      return {
        message: 'Đã hủy yêu cầu',
        data: {
          requestId: request.id,
          status: GuideRequestStatus.CANCELLED,
          conversationStatus: request.conversation
            ? ConversationStatus.CLOSED
            : null,
        },
      };
    });
  }
}
