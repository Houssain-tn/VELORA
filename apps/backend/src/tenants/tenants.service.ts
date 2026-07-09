import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  create(createTenantDto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: createTenantDto as any,
    });
  }

  findAll() {
    return this.prisma.tenant.findMany();
  }

  findOne(id: number) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  update(id: number, updateTenantDto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto as any,
    });
  }

  remove(id: number) {
    return this.prisma.tenant.delete({ where: { id } });
  }
}
