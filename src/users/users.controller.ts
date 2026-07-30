import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
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
}
