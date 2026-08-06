import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { JwtModule } from '@nestjs/jwt';
import { MessagesModule } from 'src/messages/messages.module';
import { ConversationsGateway } from './conversations.gateway';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.register({}),
    DatabaseModule,
    MessagesModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationsGateway],
  exports: [ConversationsService, ConversationsGateway],
})
export class ConversationsModule {}
