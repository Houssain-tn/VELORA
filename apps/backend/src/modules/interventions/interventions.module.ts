import { Module } from '@nestjs/common';
import { InterventionsService } from './interventions.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { InterventionsController } from './interventions.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [NotificationsModule, AuditModule],
  controllers: [InterventionsController],
  providers: [InterventionsService],
  exports: [InterventionsService],
})
export class InterventionsModule {}
