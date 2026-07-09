import { Module } from '@nestjs/common';
import { MoyensGenerauxService } from './moyens-generaux.service';
import { MoyensGenerauxController } from './moyens-generaux.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MoyensGenerauxController],
  providers: [MoyensGenerauxService],
  exports: [MoyensGenerauxService],
})
export class MoyensGenerauxModule {}
