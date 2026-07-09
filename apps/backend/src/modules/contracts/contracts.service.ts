import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { clientId, ...rest } = data;
    const createData = {
      ...rest,
      client: clientId ? { connect: { id: Number(clientId) } } : undefined,
    };
    return this.prisma.contract.create({ data: createData });
  }

  async findAll() {
    return this.prisma.contract.findMany({
      include: { client: true, sites: true, projects: true },
    });
  }

  async findOne(id: number) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { client: true, sites: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: number, data: any) {
    const { clientId, ...rest } = data;
    const updateData = {
      ...rest,
      client: clientId ? { connect: { id: Number(clientId) } } : undefined,
    };
    return this.prisma.contract.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    return this.prisma.contract.delete({ where: { id } });
  }
}
