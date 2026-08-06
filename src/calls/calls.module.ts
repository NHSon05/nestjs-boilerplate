import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from 'src/database/database.module';
import { AgoraModule } from 'src/agora/agora.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { CallsService } from './calls.service';
import { CallsController } from './calls.controller';
import { CallsGateway } from './calls.gateway';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,
    JwtModule.register({}),
    AgoraModule,
    NotificationsModule,
  ],
  controllers: [CallsController],
  providers: [CallsService, CallsGateway],
  exports: [CallsService, CallsGateway],
})
export class CallsModule {}
