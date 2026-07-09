import { Module } from '@nestjs/common';
import { ParcAutoService } from './parc-auto.service';
import { ParcAutoController } from './parc-auto.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParcAutoController],
  providers: [ParcAutoService],
  exports: [ParcAutoService],
})
export class ParcAutoModule {}
