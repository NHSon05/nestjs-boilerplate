import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { GuideRequestsController } from './guide-requests.controller';
import { GuideRequestsService } from './guide-requests.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [GuideRequestsController],
  providers: [GuideRequestsService],
  exports: [GuideRequestsService],
})
export class GuideRequestsModule {}
