import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { GetConversationsDto } from './dto/get-conversations.dto';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách cuộc trò chuyện',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetConversationsDto,
  ) {
    return this.conversationsService.findAll(user.id, query);
  }

  @Get(':conversationId')
  @ApiResponse({
    status: 200,
    description: 'Trả về chi tiết cuộc trò chuyện',
  })
  @ApiResponse({
    status: 403,
    description: 'Không thuộc cuộc trò chuyện',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy cuộc trò chuyện',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
  ) {
    return this.conversationsService.findOne(user.id, conversationId);
  }

  @Patch(':conversationId/read')
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
  ) {
    return this.conversationsService.markAsRead(user.id, conversationId);
  }
}
