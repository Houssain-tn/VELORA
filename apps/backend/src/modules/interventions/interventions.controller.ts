import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InterventionsService } from './interventions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { InterventionStatus, Role } from '@prisma/client';
import {
  CreateInterventionDto,
  UpdateInterventionStatusDto,
} from './dto/interventions.dto';

@ApiTags('Interventions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
  @Roles(
    Role.CLIENT,
    Role.TECHNICIEN,
    Role.RESPONSABLE_TECHNIQUE,
    Role.CHEF_PROJET,
    Role.DIRECTEUR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Créer une intervention' })
  create(@Body() dto: CreateInterventionDto, @CurrentUser() user: any) {
    return this.interventionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les interventions' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.interventionsService.findAll(query, user);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'KPIs des interventions' })
  getKpis() {
    return this.interventionsService.getKpis();
  }

  @Get('sla-check')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Vérifier et marquer les SLA dépassés' })
  checkSla() {
    return this.interventionsService.checkSlaBreaches();
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une intervention" })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.interventionsService.findOne(id, user);
  }

  @Patch(':id/status')
  @Roles(
    Role.TECHNICIEN,
    Role.CHEF_PROJET,
    Role.DIRECTEUR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: "Avancer le workflow de l'intervention" })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateInterventionStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.interventionsService.updateStatus(
      id,
      body.status,
      user.id || user.userId,
      body,
      user,
    );
  }

  @Put(':id')
  @Roles(
    Role.TECHNICIEN,
    Role.CHEF_PROJET,
    Role.DIRECTEUR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Mettre à jour une intervention' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.interventionsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer une intervention' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.interventionsService.remove(id, user);
  }
}
