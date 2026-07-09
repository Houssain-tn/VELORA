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
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('MaintenanceSchedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('maintenance-schedules')
export class MaintenanceSchedulesController {
  constructor(private readonly schedulesService: MaintenanceSchedulesService) {}

  @Post()
  create(@Body() dto: any) {
    return this.schedulesService.create(dto);
  }

  @Get()
  findAll() {
    return this.schedulesService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.schedulesService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(+id);
  }

  /**
   * Manual trigger for PPM Engine (System Admin Only)
   */
  @Post('trigger')
  triggerNextCycle() {
    return this.schedulesService.handlePPMGeneration();
  }
}
