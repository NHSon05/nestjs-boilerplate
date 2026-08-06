import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  Prisma,
} from '@prisma/client';

export interface NotificationPayload {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  body: string;
  data: Prisma.JsonValue | null;
  readAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}
