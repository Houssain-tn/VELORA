import { Module } from '@nestjs/common';
import { ImmobilisationsService } from './immobilisations.service';
import { ImmobilisationsController } from './immobilisations.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImmobilisationsController],
  providers: [ImmobilisationsService],
  exports: [ImmobilisationsService],
})
export class ImmobilisationsModule {}
