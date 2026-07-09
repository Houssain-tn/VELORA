import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PhasesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PhaseCreateInput) {
    return this.prisma.phase.create({ data });
  }

  async findAll() {
    return this.prisma.phase.findMany({
      include: { project: true, owner: true, tasks: true },
    });
  }

  async findOne(id: number) {
    const phase = await this.prisma.phase.findUnique({
      where: { id },
      include: { project: true, owner: true, tasks: true },
    });
    if (!phase) throw new NotFoundException('Phase not found');
    return phase;
  }

  async update(id: number, data: Prisma.PhaseUpdateInput) {
    const { progress, ...rest } = data as any;
    return this.prisma.phase.update({
      where: { id },
      data: rest,
    });
  }

  async remove(id: number) {
    return this.prisma.phase.delete({ where: { id } });
  }
}
