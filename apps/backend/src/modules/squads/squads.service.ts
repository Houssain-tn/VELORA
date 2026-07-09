import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SquadsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    color?: string;
    leaderId?: number;
    memberIds?: number[];
  }) {
    const { name, description, color, leaderId, memberIds } = data;

    return this.prisma.squad.create({
      data: {
        name,
        description,
        color,
        leaderId,
        members: memberIds
          ? {
              connect: memberIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        leader: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.squad.findMany({
      include: {
        leader: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, avatar: true } },
        _count: { select: { interventions: true } },
      },
    });
  }

  async findOne(id: number) {
    const squad = await this.prisma.squad.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, avatar: true } },
        interventions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { site: true },
        },
      },
    });

    if (!squad) throw new NotFoundException('Squad introuvable');
    return squad;
  }

  async update(
    id: number,
    data: {
      name?: string;
      description?: string;
      color?: string;
      leaderId?: number;
      memberIds?: number[];
    },
  ) {
    const { name, description, color, leaderId, memberIds } = data;

    return this.prisma.squad.update({
      where: { id },
      data: {
        name,
        description,
        color,
        leaderId,
        members: memberIds
          ? {
              set: memberIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        leader: { select: { id: true, name: true } },
        members: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async remove(id: number) {
    return this.prisma.squad.delete({ where: { id } });
  }
}
