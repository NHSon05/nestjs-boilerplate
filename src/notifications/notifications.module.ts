import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/database/database.module';
import { FirebaseAdminService } from './firebase/firebase-admin.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [ConfigModule, JwtModule.register({}), DatabaseModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, FirebaseAdminService],
  exports: [NotificationsService, NotificationsGateway, FirebaseAdminService],
})
export class NotificationsModule {}
