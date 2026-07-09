import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ImmobilisationsService } from './immobilisations.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Immobilisations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('immobilisations')
export class ImmobilisationsController {
  constructor(private readonly service: ImmobilisationsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  create(@Body() dto: Prisma.FixedAssetCreateInput) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.service.findAll({
      category,
      status,
      siteId: siteId ? +siteId : undefined,
    });
  }

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  update(@Param('id') id: string, @Body() dto: Prisma.FixedAssetUpdateInput) {
    return this.service.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
