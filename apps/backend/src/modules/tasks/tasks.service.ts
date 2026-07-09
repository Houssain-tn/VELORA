import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskStatus, Priority, Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async create(dto: any, createdById: number) {
    const {
      siteId,
      assignedTechnicianIds,
      phaseId,
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      order,
    } = dto;

    let targetPhaseId = phaseId ? Number(phaseId) : null;

    // If no phaseId but projectId is provided, link to the first phase available
    if (!targetPhaseId && projectId) {
      // Find or create a default phase for the project
      let firstPhase = await this.prisma.phase.findFirst({
        where: { projectId: Number(projectId) },
        orderBy: { order: 'asc' },
      });

      if (!firstPhase) {
        firstPhase = await this.prisma.phase.create({
          data: {
            name: 'Général',
            projectId: Number(projectId),
            order: 0,
          },
        });
      }
      targetPhaseId = firstPhase.id;
    }

    try {
      const data = {
        title,
        description,
        status: status || 'A_FAIRE',
        priority: priority || 'NORMALE',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
        actualHours: actualHours ? Number(actualHours) : undefined,
        order: order ? Number(order) : undefined,
        createdBy: { connect: { id: Number(createdById) } },
        site: siteId ? { connect: { id: Number(siteId) } } : undefined,
        assignedTechnicians:
          assignedTechnicianIds && Array.isArray(assignedTechnicianIds)
            ? {
                connect: assignedTechnicianIds.map((id) => ({
                  id: Number(id),
                })),
              }
            : undefined,
        phase: targetPhaseId ? { connect: { id: targetPhaseId } } : undefined,
      };

      const task = await this.prisma.task.create({
        data: data as any,
        include: {
          assignedTechnicians: {
            select: { id: true, name: true, avatar: true },
          },
          site: { select: { id: true, name: true } },
          phase: { select: { id: true, name: true, projectId: true } },
        },
      });

      if (task.phaseId) {
        await this.updateParentProgress(task.phaseId);
      }

      // Emit event for notification listener
      this.eventEmitter.emit('task.created', {
        task,
        actorId: createdById,
      });

      await this.auditService.create({
        action: 'CREATE',
        entity: 'TASK',
        entityId: task.id,
        userId: createdById,
        newValues: { title, status, priority, siteId },
      });

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async findAll(query: any, user?: any) {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    if (user && user.role === Role.CLIENT) {
      where.site = { contract: { clientId: user.companyId } };
    }

    if (query.assignedToId) {
      where.assignedTechnicians = {
        some: { id: Number(query.assignedToId) },
      };
    }

    if (query.siteId) where.siteId = Number(query.siteId);
    if (query.phaseId) where.phaseId = Number(query.phaseId);

    // Filter by Project Status (Decluttering logic)
    if (query.projectStatus) {
      const statuses = query.projectStatus.split(',');
      where.phase = {
        project: { status: { in: statuses } },
      };
    } else if (query.excludeArchived === 'true') {
      where.OR = [
        { phaseId: null },
        {
          phase: {
            project: { status: { notIn: ['TERMINE', 'ARCHIVE'] } },
          },
        },
      ];
    }

    if (query.search) {
      const searchOR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchOR }];
        delete where.OR;
      } else {
        where.OR = searchOR;
      }
    }

    // Pagination Support (Deep Audit Stability)
    const skip = !isNaN(Number(query.skip)) ? Number(query.skip) : undefined;
    const take = !isNaN(Number(query.take)) ? Number(query.take) : 100; // Larger batch for Kanban compatibility

    return this.prisma.task.findMany({
      where,
      skip,
      take,
      include: {
        assignedTechnicians: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        phase: {
          select: {
            id: true,
            name: true,
            projectId: true,
            project: { select: { id: true, name: true } },
          },
        },
        _count: { select: { comments: true, documents: true } },
      },
      orderBy: [{ priority: 'desc' }, { order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getKanban(query: any, user?: any) {
    const tasks = await this.findAll(query, user);

    // Group tasks by status
    const statuses: TaskStatus[] = [
      'BACKLOG',
      'A_FAIRE',
      'EN_COURS',
      'EN_REVISION',
      'TERMINE',
    ];

    return statuses.map((status) => ({
      id: status,
      title: this.getStatusLabel(status),
      tasks: tasks.filter((t: any) => t.status === status),
    }));
  }

  private getStatusLabel(status: TaskStatus): string {
    const labels = {
      BACKLOG: 'Backlog',
      A_FAIRE: 'À faire',
      EN_COURS: 'En cours',
      EN_REVISION: 'En révision',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé',
    };
    return labels[status] || status;
  }

  async findOne(id: number, user?: any) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTechnicians: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true } },
        phase: { include: { project: true } },
        site: { include: { contract: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        documents: true,
      },
    });

    if (!task) throw new NotFoundException('Tâche introuvable');

    if (user && user.role === Role.CLIENT) {
      if (task.site?.contract?.clientId !== user.companyId) {
        throw new ForbiddenException("Vous n'avez pas accès à cette tâche");
      }
    }

    return task;
  }

  async update(id: number, dto: any, user?: any) {
    const old = await this.findOne(id, user);
    const {
      siteId,
      assignedTechnicianIds,
      phaseId,
      projectId,
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
      order,
    } = dto;

    let targetPhaseId: number | null | undefined = undefined;

    if (phaseId !== undefined) {
      targetPhaseId = phaseId ? Number(phaseId) : null;
    } else if (projectId !== undefined) {
      if (!projectId || projectId === '') {
        targetPhaseId = null;
      } else {
        const pId = Number(projectId);
        if (pId !== old.phase?.projectId) {
          let firstPhase = await this.prisma.phase.findFirst({
            where: { projectId: pId },
            orderBy: { order: 'asc' },
          });

          if (!firstPhase) {
            firstPhase = await this.prisma.phase.create({
              data: {
                name: 'Général',
                projectId: pId,
                order: 0,
              },
            });
          }
          targetPhaseId = firstPhase.id;
        } else {
          if (!old.phaseId) {
            let firstPhase = await this.prisma.phase.findFirst({
              where: { projectId: pId },
              orderBy: { order: 'asc' },
            });
            if (!firstPhase) {
              firstPhase = await this.prisma.phase.create({
                data: {
                  name: 'Général',
                  projectId: pId,
                  order: 0,
                },
              });
            }
            targetPhaseId = firstPhase.id;
          } else {
            targetPhaseId = old.phaseId;
          }
        }
      }
    }

    const data: any = {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      estimatedHours: estimatedHours ? Number(estimatedHours) : undefined,
      actualHours: actualHours ? Number(actualHours) : undefined,
      order: order ? Number(order) : undefined,
      site: siteId ? { connect: { id: Number(siteId) } } : undefined,
      assignedTechnicians:
        assignedTechnicianIds && Array.isArray(assignedTechnicianIds)
          ? { set: assignedTechnicianIds.map((id) => ({ id: Number(id) })) }
          : undefined,
    };

    if (targetPhaseId === null) {
      data.phase = { disconnect: true };
    } else if (targetPhaseId !== undefined) {
      data.phase = { connect: { id: targetPhaseId } };
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data,
      include: {
        assignedTechnicians: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
        phase: { select: { id: true, name: true, projectId: true } },
      },
    });

    const hasStatusChanged = dto.status && dto.status !== old.status;
    const hasPhaseChanged = updated.phaseId !== old.phaseId;

    if (hasStatusChanged || hasPhaseChanged) {
      if (old.phaseId) await this.updateParentProgress(old.phaseId);
      if (updated.phaseId && updated.phaseId !== old.phaseId) {
        await this.updateParentProgress(updated.phaseId);
      }
    }

    // Emit event for notification listener
    this.eventEmitter.emit('task.updated', {
      task: updated,
      oldTask: old,
      actorId: user?.id,
    });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'TASK',
      entityId: id,
      userId: user?.id,
      newValues: { status, priority, title },
    });

    return updated;
  }

  async remove(id: number, user?: any) {
    const task = await this.findOne(id, user);
    await this.prisma.task.update({
      where: { id },
      data: { status: 'ANNULE' },
    });

    if (task.phaseId) {
      await this.updateParentProgress(task.phaseId);
    }

    await this.auditService.create({
      action: 'DELETE',
      entity: 'TASK',
      entityId: id,
      userId: user?.id,
    });

    return { message: 'Tâche supprimée' };
  }

  async reorder(tasks: { id: number; order: number; status: TaskStatus }[]) {
    await Promise.all(
      tasks.map((t) =>
        this.prisma.task.update({
          where: { id: t.id },
          data: { order: t.order, status: t.status },
        }),
      ),
    );

    const taskIds = tasks.map((t) => t.id);
    const affectedTasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { phaseId: true },
    });

    const uniquePhaseIds = [
      ...new Set(affectedTasks.map((t) => t.phaseId).filter(Boolean)),
    ];
    for (const phaseId of uniquePhaseIds as number[]) {
      await this.updateParentProgress(phaseId);
    }

    return { message: 'Tâches réorganisées' };
  }

  async syncAllProgress() {
    const phases = await this.prisma.phase.findMany({ select: { id: true } });
    for (const phase of phases) {
      await this.updateParentProgress(phase.id);
    }
    return { count: phases.length };
  }

  private async updateParentProgress(phaseId: number | null) {
    if (!phaseId) return;

    try {
      const phase = await this.prisma.phase.findUnique({
        where: { id: phaseId },
        select: { projectId: true },
      });
      if (!phase) return;

      const projectId = phase.projectId;

      const phaseTasks = await this.prisma.task.findMany({
        where: { phaseId, status: { not: 'ANNULE' } },
        select: { status: true },
      });

      const totalPhase = phaseTasks.length;
      const donePhase = phaseTasks.filter((t) => t.status === 'TERMINE').length;
      const phaseProgress =
        totalPhase > 0 ? Math.round((donePhase / totalPhase) * 100) : 0;

      await this.prisma.phase.update({
        where: { id: phaseId },
        data: { progress: phaseProgress },
      });

      const projectTasks = await this.prisma.task.findMany({
        where: {
          phase: { projectId },
          status: { not: 'ANNULE' },
        },
        select: { status: true },
      });

      const totalProject = projectTasks.length;
      const doneProject = projectTasks.filter(
        (t) => t.status === 'TERMINE',
      ).length;
      const projectProgress =
        totalProject > 0 ? Math.round((doneProject / totalProject) * 100) : 0;

      await this.prisma.project.update({
        where: { id: projectId },
        data: { progress: projectProgress },
      });
    } catch (error) {
      console.error('Failed to update progress automatically:', error);
    }
  }

  /**
   * TASK REMINDER ENGINE
   * Runs every day at 8 AM.
   * Notifies technicians of tasks due today or tomorrow.
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleTaskReminders() {
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(addDays(today, 1));

    const upcomingTasks = await this.prisma.task.findMany({
      where: {
        status: { not: 'TERMINE' },
        dueDate: {
          gte: today,
          lte: tomorrow,
        },
      },
      include: {
        assignedTechnicians: { select: { id: true, name: true } },
      },
    });

    for (const task of upcomingTasks) {
      for (const tech of task.assignedTechnicians) {
        await this.notificationsService.create({
          userId: tech.id,
          type: 'TASK_REMINDER',
          title: 'Rappel de Échéance',
          message: `La tâche "${task.title}" arrive à échéance le ${task.dueDate?.toLocaleDateString()}.`,
          link: `/kanban`,
        });
      }
    }
  }
}
