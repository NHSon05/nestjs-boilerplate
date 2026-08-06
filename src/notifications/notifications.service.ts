import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { RemoveDeviceTokenDto } from './dto/remove-device-token.dto';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { NotificationsGateway } from './notifications.gateway';

export interface SendNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  channel?: NotificationChannel;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel ?? NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        deliveredAt: new Date(),
      },
      select: this.notificationSelect(),
    });

    this.notificationsGateway.emitNotification(dto.userId, notification);

    const unreadCount = await this.getUnreadCountValue(dto.userId);

    this.notificationsGateway.emitUnreadCount(dto.userId, unreadCount);

    await this.sendPushToUserDevices(
      dto.userId,
      dto.title,
      dto.body,
      dto.data as Record<string, any> | undefined,
    );

    return notification;
  }

  async createWithTransaction(
    tx: Prisma.TransactionClient,
    dto: CreateNotificationDto,
  ) {
    return tx.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        channel: dto.channel ?? NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        deliveredAt: new Date(),
      },
      select: this.notificationSelect(),
    });
  }

  async emitCreatedNotification(
    notification: Awaited<
      ReturnType<NotificationsService['createWithTransaction']>
    >,
  ) {
    this.notificationsGateway.emitNotification(
      notification.userId,
      notification,
    );

    const unreadCount = await this.getUnreadCountValue(notification.userId);

    this.notificationsGateway.emitUnreadCount(notification.userId, unreadCount);

    await this.sendPushToUserDevices(
      notification.userId,
      notification.title,
      notification.body,
      notification.data as Record<string, any> | undefined,
    );
  }

  async findAll(userId: string, query: GetNotificationsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,

      ...(query.type
        ? {
            type: query.type,
          }
        : {}),

      ...(query.unreadOnly
        ? {
            readAt: null,
          }
        : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: this.notificationSelect(),
      }),

      this.prisma.notification.count({
        where,
      }),

      this.getUnreadCountValue(userId),
    ]);

    return {
      data: notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.getUnreadCountValue(userId);

    return {
      data: {
        unreadCount,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        userId: true,
        readAt: true,
        deletedAt: true,
      },
    });

    if (!notification || notification.deletedAt) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đọc thông báo này');
    }

    if (notification.readAt) {
      return {
        message: 'Thông báo đã được đọc trước đó',
        data: notification,
      };
    }

    const readAt = new Date();

    const updated = await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        readAt,
      },
      select: this.notificationSelect(),
    });

    this.notificationsGateway.emitNotificationRead(
      userId,
      notificationId,
      readAt,
    );

    const unreadCount = await this.getUnreadCountValue(userId);

    this.notificationsGateway.emitUnreadCount(userId, unreadCount);

    return {
      message: 'Đã đánh dấu thông báo là đã đọc',
      data: updated,
    };
  }

  async markAllAsRead(userId: string) {
    const readAt = new Date();

    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        deletedAt: null,
      },
      data: {
        readAt,
      },
    });

    this.notificationsGateway.emitAllRead(userId, readAt);

    return {
      message: 'Đã đánh dấu tất cả thông báo là đã đọc',
      data: {
        updatedCount: result.count,
        readAt,
      },
    };
  }

  async remove(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        userId: true,
        deletedAt: true,
      },
    });

    if (!notification || notification.deletedAt) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa thông báo này');
    }

    const deletedAt = new Date();

    await this.prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        deletedAt,
      },
    });

    const unreadCount = await this.getUnreadCountValue(userId);

    this.notificationsGateway.emitUnreadCount(userId, unreadCount);

    return {
      message: 'Đã xóa thông báo',
      data: {
        id: notificationId,
        deletedAt,
      },
    };
  }

  async registerDeviceToken(
    currentUserId: string,
    dto: RegisterDeviceTokenDto,
  ) {
    const deviceToken = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId: currentUserId,
        token: dto.token,
        deviceType: dto.deviceType ?? 'ANDROID',
        isActive: true,
      },
      update: {
        userId: currentUserId,
        deviceType: dto.deviceType ?? 'ANDROID',
        isActive: true,
      },
    });

    return {
      message: 'Đăng ký Device Token thành công',
      data: deviceToken,
    };
  }

  async removeDeviceToken(currentUserId: string, dto: RemoveDeviceTokenDto) {
    await this.prisma.deviceToken.updateMany({
      where: {
        token: dto.token,
        userId: currentUserId,
      },
      data: {
        isActive: false,
      },
    });

    return {
      message: 'Đã hủy đăng ký Device Token',
      data: { token: dto.token },
    };
  }

  async sendNotification(payload: SendNotificationPayload) {
    return this.create({
      userId: payload.userId,
      type: payload.type,
      channel: payload.channel ?? NotificationChannel.IN_APP,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
  }

  private async sendPushToUserDevices(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: { token: true },
    });

    if (deviceTokens.length === 0) {
      return;
    }

    const tokens = deviceTokens.map((t) => t.token);

    const pushResult = await this.firebaseAdminService.sendMulticastPush(
      tokens,
      {
        title,
        body,
        data,
      },
    );

    if (pushResult.failedTokens.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: {
          token: { in: pushResult.failedTokens },
        },
        data: {
          isActive: false,
        },
      });
    }
  }

  private getUnreadCountValue(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
        deletedAt: null,
      },
    });
  }

  private notificationSelect() {
    return {
      id: true,
      userId: true,
      type: true,
      channel: true,
      status: true,
      title: true,
      body: true,
      data: true,
      readAt: true,
      deliveredAt: true,
      createdAt: true,
    } satisfies Prisma.NotificationSelect;
  }
}
