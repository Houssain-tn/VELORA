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
import { ParcAutoService } from './parc-auto.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Parc Automobile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('parc-auto')
export class ParcAutoController {
  constructor(private readonly service: ParcAutoService) {}

  @Post('vehicles')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  createVehicle(@Body() dto: Prisma.VehicleCreateInput) {
    return this.service.createVehicle(dto);
  }

  @Get('vehicles')
  findAllVehicles(
    @Query('status') status?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.service.findAllVehicles({
      status,
      siteId: siteId ? +siteId : undefined,
    });
  }

  @Get('vehicles/stats')
  getFleetStats() {
    return this.service.getFleetStats();
  }

  @Get('vehicles/:id')
  findOneVehicle(@Param('id') id: string) {
    return this.service.findOneVehicle(+id);
  }

  @Patch('vehicles/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  updateVehicle(
    @Param('id') id: string,
    @Body() dto: Prisma.VehicleUpdateInput,
  ) {
    return this.service.updateVehicle(+id, dto);
  }

  @Delete('vehicles/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeVehicle(@Param('id') id: string) {
    return this.service.removeVehicle(+id);
  }

  // FUEL LOGS
  @Post('fuel')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.TECHNICIEN)
  createFuelLog(@Body() dto: Prisma.FuelLogCreateInput) {
    return this.service.createFuelLog(dto);
  }

  @Get('fuel')
  findAllFuelLogs(@Query('vehicleId') vehicleId?: string) {
    return this.service.findAllFuelLogs(vehicleId ? +vehicleId : undefined);
  }

  @Delete('fuel/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteFuelLog(@Param('id') id: string) {
    return this.service.deleteFuelLog(+id);
  }

  // MISSIONS
  @Post('missions')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  createMission(@Body() dto: Prisma.VehicleMissionCreateInput) {
    return this.service.createMission(dto);
  }

  @Get('missions')
  findAllMissions(@Query('vehicleId') vehicleId?: string) {
    return this.service.findAllMissions(vehicleId ? +vehicleId : undefined);
  }

  @Patch('missions/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.TECHNICIEN)
  updateMission(
    @Param('id') id: string,
    @Body() dto: Prisma.VehicleMissionUpdateInput,
  ) {
    return this.service.updateMission(+id, dto);
  }

  @Delete('missions/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  deleteMission(@Param('id') id: string) {
    return this.service.deleteMission(+id);
  }
}
