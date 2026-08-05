import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  type AuthenticatedUser,
} from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations/:conversationId/messages')
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách tin nhắn',
  })
  findByConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Query() query: GetMessagesDto,
  ) {
    return this.messagesService.findByConversation(
      user.id,
      conversationId,
      query,
    );
  }

  @Post('conversations/:conversationId/messages')
  @ApiResponse({
    status: 201,
    description: 'Gửi tin nhắn thành công',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messagesService.create(user.id, conversationId, dto);
  }

  @Patch('messages/:messageId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe)
    messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.update(user.id, messageId, dto);
  }

  @Delete('messages/:messageId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('messageId', ParseUUIDPipe)
    messageId: string,
  ) {
    return this.messagesService.remove(user.id, messageId);
  }
}
