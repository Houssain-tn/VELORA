import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: {
    content: string;
    taskId?: number;
    interventionId?: number;
    userId: number;
  }) {
    const comment = (await this.prisma.comment.create({
      data: {
        content: dto.content,
        userId: dto.userId,
        taskId: dto.taskId,
        interventionId: dto.interventionId,
        isInternal: dto.taskId ? true : false,
      },
      include: {
        user: { select: { name: true } },
        task: {
          select: {
            title: true,
            createdById: true,
            assignedTechnicians: { select: { id: true } },
          },
        },
        intervention: {
          select: {
            title: true,
            requestedById: true,
            assignedTechnicians: { select: { id: true } },
            reference: true,
          },
        },
      },
    })) as any;

    // Delegating to Pro Notification Engine
    this.eventEmitter.emit('comment.created', { comment, actorId: dto.userId });

    return comment;
  }

  async findByIntervention(interventionId: number, userRole?: Role) {
    const where: any = { interventionId };
    if (userRole === Role.CLIENT) {
      where.isInternal = false;
    }

    return this.prisma.comment.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByTask(taskId: number, userRole?: Role) {
    const where: any = { taskId };
    if (userRole === Role.CLIENT) {
      where.isInternal = false;
    }

    return this.prisma.comment.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
