import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EquipmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.EquipmentCreateInput) {
    if (!data.qrCode) {
      data.qrCode = `EQ-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
    }
    return this.prisma.equipment.create({ data });
  }

  async findAll() {
    return this.prisma.equipment.findMany({
      include: { site: true },
    });
  }

  async findOne(id: number) {
    const equip = await this.prisma.equipment.findUnique({
      where: { id },
      include: { site: true, interventions: true },
    });
    if (!equip) throw new NotFoundException('Equipment not found');
    return equip;
  }

  async update(id: number, data: Prisma.EquipmentUpdateInput) {
    return this.prisma.equipment.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.equipment.delete({ where: { id } });
  }
}
