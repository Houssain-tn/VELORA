import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  MeetingStatus,
  Role,
  MeetingType,
  TaskStatus,
  Priority,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addMinutes, subMinutes } from 'date-fns';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateMeetingDto, userId: number, userRole: Role) {
    const { participantIds, projectId, siteId, clientId, ...rest } = dto;

    const meeting = await this.prisma.meeting.create({
      data: {
        ...rest,
        startTime: rest.startTime ? new Date(rest.startTime) : null,
        endTime: rest.endTime ? new Date(rest.endTime) : null,
        createdById: userId,
        projectId: projectId ? Number(projectId) : null,
        siteId: siteId ? Number(siteId) : null,
        clientId: clientId ? Number(clientId) : null,
        participants:
          participantIds && participantIds.length > 0
            ? { connect: participantIds.map((id) => ({ id })) }
            : undefined,
        status:
          userRole === Role.CLIENT
            ? MeetingStatus.PENDING
            : MeetingStatus.SCHEDULED,
      },
      include: {
        createdBy: { select: { name: true, email: true } },
        participants: { select: { id: true, name: true } },
      },
    });

    // Emit event for notification listener
    this.eventEmitter.emit('meeting.created', {
      meeting,
      actorId: userId,
      actorRole: userRole,
    });

    return meeting;
  }

  async findAll(user: any) {
    const where: any = {};

    // RBAC: Client only sees their own or project-related meetings
    if (user.role === Role.CLIENT) {
      where.OR = [
        { createdById: user.id },
        { clientId: user.companyId },
        { participants: { some: { id: user.id } } },
      ];
    } else if (user.role === Role.TECHNICIEN) {
      // Technicians see assigned meetings or internal ones they are part of
      where.participants = { some: { id: user.id } };
    }

    return this.prisma.meeting.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        participants: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(id: number, user: any) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatar: true } },
        participants: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
      },
    });

    if (!meeting) throw new NotFoundException('Réunion introuvable');

    // Basic permission check
    if (
      user.role === Role.CLIENT &&
      meeting.clientId !== user.companyId &&
      meeting.createdById !== user.id
    ) {
      throw new ForbiddenException("Vous n'avez pas accès à cette réunion");
    }

    return meeting;
  }

  async update(id: number, dto: UpdateMeetingDto, user: any) {
    const current = await this.findOne(id, user);
    const { participantIds, ...rest } = dto;

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: {
        ...rest,
        startTime: rest.startTime ? new Date(rest.startTime) : undefined,
        endTime: rest.endTime ? new Date(rest.endTime) : undefined,
        participants: participantIds
          ? { set: participantIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        participants: { select: { id: true, name: true } },
      },
    });

    // Emit event for notification listener
    this.eventEmitter.emit('meeting.updated', {
      meeting: updated,
      previousStatus: current.status,
      actorId: user.id,
    });

    return updated;
  }

  async remove(id: number) {
    await this.prisma.meeting.delete({ where: { id } });
    return { message: 'Réunion supprimée avec succès' };
  }

  async convertToTask(id: number, noteContent: string, userId: number) {
    const meeting = await this.findOne(id, { id: userId, role: Role.ADMIN }); // Admin bypass for internal check

    const task = await this.prisma.task.create({
      data: {
        title: `Action: ${meeting.title}`,
        description:
          noteContent ||
          `Tache générée depuis la réunion du ${meeting.startTime}\n\nConclusion: ${meeting.conclusion}`,
        status: TaskStatus.A_FAIRE,
        priority: Priority.HAUTE,
        createdById: userId,
        siteId: meeting.siteId,
      },
    });

    // Update meeting notes to mention the task
    await this.prisma.meeting.update({
      where: { id },
      data: {
        notes: (meeting.notes || '') + `\n\n[TASK GENERATED: ${task.id}]`,
      },
    });

    return task;
  }

  /**
   * MEETING REMINDER ENGINE
   * Runs every 5 minutes to check for upcoming meetings.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleMeetingReminders() {
    const now = new Date();
    const windowStart = addMinutes(now, 10);
    const windowEnd = addMinutes(now, 20);

    const upcomingMeetings = await this.prisma.meeting.findMany({
      where: {
        status: MeetingStatus.SCHEDULED,
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        participants: { select: { id: true, name: true } },
      },
    });

    for (const meeting of upcomingMeetings) {
      for (const participant of meeting.participants) {
        await this.notificationsService.create({
          userId: participant.id,
          type: 'MEETING_REMINDER',
          title: 'Rappel de Réunion',
          message: `La réunion "${meeting.title}" commence dans environ 15 minutes.`,
          link: `/meetings`,
        });
      }
    }
  }
}
