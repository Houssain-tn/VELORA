import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { Prisma, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  create(@Body() createSiteDto: Prisma.SiteCreateInput) {
    return this.sitesService.create(createSiteDto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.sitesService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.sitesService.findOne(+id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  update(
    @Param('id') id: string,
    @Body() updateSiteDto: Prisma.SiteUpdateInput,
  ) {
    return this.sitesService.update(+id, updateSiteDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  remove(@Param('id') id: string) {
    return this.sitesService.remove(+id);
  }
}
