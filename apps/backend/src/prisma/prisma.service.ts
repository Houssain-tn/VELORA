import {
  Injectable,
  OnModuleInit,
  INestApplication,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('✅ Database connected (MySQL via Prisma)');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('📡 Database connection closed');
  }
}
