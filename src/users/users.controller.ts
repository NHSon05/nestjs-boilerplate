import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { SwitchRoleDto } from './dto/switch-role.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Return current authenticated user details',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, dto);
  }

  @Patch('me/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'User role switched successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  switchRole(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchRoleDto,
  ) {
    return this.usersService.switchRole(user.id, dto);
  }

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh đại diện (png, jpg, jpeg, webp, max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật ảnh đại diện thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc vượt quá 5MB',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized / Invalid Access Token',
  })
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024, // 5MB
            message: 'Kích thước file ảnh không được vượt quá 5MB',
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(user.id, file);
  }
}
