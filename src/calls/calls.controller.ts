import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { GetCallHistoryDto } from './dto/get-call-history.dto';

@ApiTags('Calls')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post('conversations/:conversationId/calls')
  @ApiParam({ name: 'conversationId', description: 'UUID của cuộc trò chuyện' })
  @ApiResponse({
    status: 201,
    description: 'Bắt đầu cuộc gọi thành công và nhận RTC Token',
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu người nhận hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không thuộc cuộc trò chuyện này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc trò chuyện' })
  @ApiResponse({
    status: 409,
    description: 'Cuộc trò chuyện đang có cuộc gọi khác',
  })
  createCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: CreateCallDto,
  ) {
    return this.callsService.createCall(user.id, conversationId, dto);
  }

  @Get('conversations/:conversationId/calls')
  @ApiParam({ name: 'conversationId', description: 'UUID của cuộc trò chuyện' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách cuộc gọi trong cuộc trò chuyện',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không thuộc cuộc trò chuyện này',
  })
  getConversationCalls(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: GetCallHistoryDto,
  ) {
    return this.callsService.getConversationCalls(
      user.id,
      conversationId,
      query,
    );
  }

  @Patch('calls/:callId/accept')
  @ApiParam({ name: 'callId', description: 'UUID của cuộc gọi' })
  @ApiResponse({
    status: 200,
    description: 'Chấp nhận cuộc gọi thành công và lấy Agora RTC token',
  })
  @ApiResponse({
    status: 403,
    description: 'Bạn không phải người nhận cuộc gọi',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc gọi' })
  @ApiResponse({
    status: 409,
    description: 'Cuộc gọi không ở trạng thái đổ chuông',
  })
  acceptCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.acceptCall(user.id, callId);
  }

  @Patch('calls/:callId/reject')
  @ApiParam({ name: 'callId', description: 'UUID của cuộc gọi' })
  @ApiResponse({ status: 200, description: 'Từ chối cuộc gọi thành công' })
  @ApiResponse({
    status: 403,
    description: 'Bạn không phải người nhận cuộc gọi',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc gọi' })
  @ApiResponse({ status: 409, description: 'Cuộc gọi không thể bị từ chối' })
  rejectCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.rejectCall(user.id, callId);
  }

  @Patch('calls/:callId/cancel')
  @ApiParam({ name: 'callId', description: 'UUID của cuộc gọi' })
  @ApiResponse({ status: 200, description: 'Hủy cuộc gọi thành công' })
  @ApiResponse({
    status: 403,
    description: 'Chỉ người gọi mới được hủy cuộc gọi',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc gọi' })
  @ApiResponse({ status: 409, description: 'Cuộc gọi không thể bị hủy' })
  cancelCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.cancelCall(user.id, callId);
  }

  @Patch('calls/:callId/end')
  @ApiParam({ name: 'callId', description: 'UUID của cuộc gọi' })
  @ApiResponse({ status: 200, description: 'Kết thúc cuộc gọi thành công' })
  @ApiResponse({ status: 403, description: 'Bạn không thuộc cuộc gọi này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc gọi' })
  @ApiResponse({
    status: 409,
    description: 'Chỉ cuộc gọi đã được chấp nhận mới có thể kết thúc',
  })
  endCall(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.endCall(user.id, callId);
  }

  @Get('calls/:callId/agora-token')
  @ApiParam({ name: 'callId', description: 'UUID của cuộc gọi' })
  @ApiResponse({ status: 200, description: 'Trả về Agora RTC Token' })
  @ApiResponse({ status: 403, description: 'Bạn không thuộc cuộc gọi này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy cuộc gọi' })
  getAgoraToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('callId', ParseUUIDPipe) callId: string,
  ) {
    return this.callsService.getAgoraToken(user.id, callId);
  }
}
