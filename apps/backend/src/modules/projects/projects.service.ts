import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: any) {
    const { managerId, contractId, ...rest } = data;
    const createData = {
      ...rest,
      manager: managerId ? { connect: { id: Number(managerId) } } : undefined,
      contract: contractId
        ? { connect: { id: Number(contractId) } }
        : undefined,
      phases: {
        create: {
          name: 'Général',
          order: 0,
        },
      },
    };
    const project = await this.prisma.project.create({
      data: createData,
    });

    // Announce the new project to the system
    this.eventEmitter.emit('project.created', {
      project,
      actorId: managerId || null,
    });

    return project;
  }

  async findAll() {
    return this.prisma.project.findMany({
      include: {
        manager: true,
        contract: true,
        phases: {
          include: { tasks: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        manager: true,
        contract: true,
        phases: { include: { tasks: true } },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: number, data: any) {
    const { managerId, contractId, progress, status, ...rest } = data;
    const updateData = {
      ...rest,
      status,
      manager: managerId ? { connect: { id: Number(managerId) } } : undefined,
      contract: contractId
        ? { connect: { id: Number(contractId) } }
        : undefined,
    };
    const updated = await this.prisma.project.update({
      where: { id },
      data: updateData,
    });

    this.eventEmitter.emit('project.updated', {
      project: updated,
      actorId: managerId || null,
    });

    return updated;
  }

  async remove(id: number) {
    return this.prisma.project.delete({ where: { id } });
  }
}
