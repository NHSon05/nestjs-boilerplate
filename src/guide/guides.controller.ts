import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorators/current-user.decorator';
import { UpdateGuideProfileDto } from './dto/update-guide-profile.dto';
import { AddGuideLanguageDto } from './dto/guide-language.dto';

@ApiTags('guides')
@Controller('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateGuideProfileDto,
  ) {
    return this.guidesService.updateMyProfile(user.id, dto);
  }

  @Get('me/languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyLanguages(@CurrentUser() user: AuthenticatedUser) {
    return this.guidesService.getMyLanguages(user.id);
  }

  @Post('me/languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddGuideLanguageDto,
  ) {
    return this.guidesService.addLanguage(user.id, dto);
  }

  @Delete('me/languages/:languageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  removeLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('languageId') languageId: string,
  ) {
    return this.guidesService.removeLanguage(user.id, languageId);
  }
}
