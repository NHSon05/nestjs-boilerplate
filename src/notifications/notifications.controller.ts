import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  type AuthenticatedUser,
  CurrentUser,
} from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { RemoveDeviceTokenDto } from './dto/remove-device-token.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Trả về danh sách thông báo' })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.findAll(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc' })
  getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch('read-all')
  @ApiResponse({ status: 200, description: 'Đã đọc tất cả thông báo' })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Patch(':notificationId/read')
  @ApiResponse({ status: 200, description: 'Đã đánh dấu đã đọc' })
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseUUIDPipe)
    notificationId: string,
  ) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }

  @Delete(':notificationId')
  @ApiResponse({ status: 200, description: 'Đã xóa thông báo' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('notificationId', ParseUUIDPipe)
    notificationId: string,
  ) {
    return this.notificationsService.remove(user.id, notificationId);
  }

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng ký FCM Device Token cho Push Notification' })
  @ApiResponse({ status: 200, description: 'Đăng ký thành công' })
  registerDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.notificationsService.registerDeviceToken(user.id, dto);
  }

  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hủy đăng ký FCM Device Token' })
  @ApiResponse({ status: 200, description: 'Hủy đăng ký thành công' })
  removeDeviceToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RemoveDeviceTokenDto,
  ) {
    return this.notificationsService.removeDeviceToken(user.id, dto);
  }
}
