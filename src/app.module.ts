import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TouristsModule } from './tourist/tourists.module';
import { GuidesModule } from './guide/guides.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { LocationsModule } from './locations/locations.module';
import { GuideRequestsModule } from './guide-request/guide-requests.module';
import { CallsModule } from './calls/calls.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { UploadsModule } from './upload/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CloudinaryModule,
    UsersModule,
    TouristsModule,
    GuidesModule,
    LocationsModule,
    AuthModule,
    GuideRequestsModule,
    CallsModule,
    ConversationsModule,
    MessagesModule,
    UploadsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
