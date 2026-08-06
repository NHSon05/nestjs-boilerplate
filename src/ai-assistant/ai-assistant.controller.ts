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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';
import { CreateAiConversationDto } from './dto/create-ai-conversation.dto';
import { GetAiConversationsDto } from './dto/get-ai-conversations.dto';
import { GetAiMessagesDto } from './dto/get-ai-messages.dto';
import { SendAiMessageDto } from './dto/send-ai-message.dto';
import { UpdateAiConversationDto } from './dto/update-ai-conversation.dto';

@ApiTags('AI Assistant')
@ApiBearerAuth()
@Controller('ai/conversations')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private readonly aiAssistantService: AiAssistantService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo cuộc trò chuyện AI',
  })
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAiConversationDto,
  ) {
    return this.aiAssistantService.createConversation(user.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách cuộc trò chuyện AI',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetAiConversationsDto,
  ) {
    return this.aiAssistantService.findAll(user.id, query);
  }

  @Get(':conversationId/messages')
  @ApiOperation({
    summary: 'Lấy lịch sử tin nhắn AI',
  })
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Query() query: GetAiMessagesDto,
  ) {
    return this.aiAssistantService.getMessages(user.id, conversationId, query);
  }

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: 'Gửi tin nhắn cho AI',
  })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Body() dto: SendAiMessageDto,
  ) {
    return this.aiAssistantService.sendMessage(user.id, conversationId, dto);
  }

  @Get(':conversationId')
  @ApiOperation({
    summary: 'Lấy chi tiết cuộc trò chuyện AI',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
  ) {
    return this.aiAssistantService.findOne(user.id, conversationId);
  }

  @Patch(':conversationId')
  @ApiOperation({
    summary: 'Đổi tên hoặc lưu trữ conversation AI',
  })
  updateConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
    @Body() dto: UpdateAiConversationDto,
  ) {
    return this.aiAssistantService.updateConversation(
      user.id,
      conversationId,
      dto,
    );
  }

  @Delete(':conversationId')
  @ApiOperation({
    summary: 'Xóa mềm conversation AI',
  })
  removeConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe)
    conversationId: string,
  ) {
    return this.aiAssistantService.removeConversation(user.id, conversationId);
  }
}
