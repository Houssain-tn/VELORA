import { Module } from '@nestjs/common';
import { MaintenanceSchedulesService } from './maintenance-schedules.service';
import { MaintenanceSchedulesController } from './maintenance-schedules.controller';

@Module({
  controllers: [MaintenanceSchedulesController],
  providers: [MaintenanceSchedulesService],
  exports: [MaintenanceSchedulesService],
})
export class MaintenanceSchedulesModule {}
