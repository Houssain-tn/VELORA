import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  InterventionStatus,
  InterventionType,
  Priority,
  Role,
} from '@prisma/client';
import { addHours } from 'date-fns';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class InterventionsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async create(dto: any, user: any) {
    const createdById = user.id;
    // Get SLA from contract via site
    const site = await this.prisma.site.findUnique({
      where: { id: Number(dto.siteId) },
      include: { contract: { include: { client: true } } },
    });

    const slaHours = site?.contract?.slaHours || 24;
    const slaDeadline = addHours(new Date(), slaHours);

    // Generate reference atomically using a high-load-safe strategy (Year + Max + 1)
    const latestIntervention = await this.prisma.intervention.findFirst({
      where: {
        reference: { startsWith: `INT-${new Date().getFullYear()}` },
      },
      orderBy: { id: 'desc' },
      select: { reference: true },
    });

    let nextNum = 1;
    if (latestIntervention?.reference) {
      const parts = latestIntervention.reference.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const reference = `INT-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

    const {
      title,
      description,
      type,
      priority,
      siteId,
      equipmentId,
      assignedTechnicianIds = [],
      squadId,
      billable,
    } = dto;

    let allTechnicianIds = [...(assignedTechnicianIds as number[])];

    // If squad assigned, fetch its members and add them
    if (squadId) {
      const squad = await this.prisma.squad.findUnique({
        where: { id: Number(squadId) },
        include: { members: { select: { id: true } } },
      });
      if (squad) {
        const squadMemberIds = squad.members.map((m) => m.id);
        allTechnicianIds = Array.from(
          new Set([...allTechnicianIds, ...squadMemberIds]),
        );
      }
    }

    let finalSiteId = Number(siteId) > 0 ? Number(siteId) : null;
    
    if (!finalSiteId && dto.companyId) {
      const firstSite = await this.prisma.site.findFirst({
        where: { contract: { clientId: Number(dto.companyId) } },
        select: { id: true }
      });
      if (firstSite) finalSiteId = firstSite.id;
    }

    const intervention = await this.prisma.intervention.create({
      data: {
        title,
        description,
        type,
        priority,
        siteId: finalSiteId,
        manualLocation: dto.manualLocation,
        equipmentId:
          Number(equipmentId) > 0
            ? Number(equipmentId)
            : equipmentId === null
              ? null
              : undefined,
        reference,
        requestedById: createdById,
        slaDeadline,
        status: InterventionStatus.DEMANDE,
        billable: billable === true || billable === 'true',
        squadId:
          Number(squadId) > 0
            ? Number(squadId)
            : squadId === null
              ? null
              : undefined,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        assignedTechnicians:
          allTechnicianIds.length > 0
            ? {
                connect: allTechnicianIds.map((id: number) => ({
                  id: Number(id),
                })),
              }
            : undefined,
      },
      include: {
        site: true,
        equipment: true,
        assignedTechnicians: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    await this.auditService.create({
      action: 'CREATE',
      entity: 'INTERVENTION',
      entityId: intervention.id,
      userId: createdById,
      newValues: { reference, title, type, siteId },
    });

    // Emit event for notification and real-time refresh
    this.eventEmitter.emit('intervention.created', {
      intervention,
      actorId: createdById,
      actorRole: user?.role,
    });

    return intervention;
  }

  async findAll(query: any, user?: any) {
    const where: Prisma.InterventionWhereInput = {};

    // If technician, only show interventions where they are part of the team
    if (user && user.role === Role.TECHNICIEN) {
      where.assignedTechnicians = { some: { id: user.id } };
    }

    if (query.status) where.status = query.status;
    else if (query.excludeArchived === 'true') {
      where.status = {
        notIn: [InterventionStatus.CLOTUREE, InterventionStatus.ANNULEE],
      };
    }
    if (query.type) where.type = query.type;

    if (query.siteId && !isNaN(Number(query.siteId))) {
      where.siteId = Number(query.siteId);
    }

    if (query.squadId && !isNaN(Number(query.squadId))) {
      where.squadId = Number(query.squadId);
    }

    if (query.technicianId && !isNaN(Number(query.technicianId))) {
      where.assignedTechnicians = { some: { id: Number(query.technicianId) } };
    }

    if (query.slaBreached === 'true') where.slaBreached = true;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { reference: { contains: query.search } },
      ];
    }

    // Role-based filtering: CLIENT role only sees their own company's interventions
    if (user.role === Role.CLIENT && user.companyId) {
      where.site = {
        contract: {
          clientId: user.companyId,
        },
      };
    }

    // Pagination Support (Deep Audit Stability)
    const skip = !isNaN(Number(query.skip)) ? Number(query.skip) : undefined;
    const take = !isNaN(Number(query.take)) ? Number(query.take) : 50; // Dynamic default for high-standing perf

    try {
      const results = await this.prisma.intervention.findMany({
        where,
        skip,
        take,
        include: {
          site: { include: { contract: { include: { client: true } } } },
          assignedTechnicians: {
            select: { id: true, name: true, avatar: true },
          },
          requestedBy: { select: { id: true, name: true } },
          invoice: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return results;
    } catch (error) {
      console.error(' ERROR in findAll:', error);
      throw error;
    }
  }

  async findOne(id: number, user?: any) {
    const intervention = await this.prisma.intervention.findUnique({
      where: { id },
      include: {
        site: { include: { contract: { include: { client: true } } } },
        assignedTechnicians: { select: { id: true, name: true, avatar: true } },
        requestedBy: { select: { id: true, name: true } },
        squad: { select: { id: true, name: true, color: true } },
        comments: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
        },
        documents: true,
        equipment: true,
        invoice: { select: { id: true, number: true } },
      },
    });

    if (!intervention) throw new NotFoundException('Intervention introuvable');

    // Security Hardening: Technicians only see interventions they are part of
    if (user && user.role === Role.TECHNICIEN) {
      const isAssigned = intervention.assignedTechnicians.some(
        (t) => t.id === user.id,
      );
      const isInSquad =
        intervention.squadId &&
        user.memberOf?.some((s: any) => s.id === intervention.squadId);

      if (!isAssigned && !isInSquad) {
        throw new ForbiddenException(
          "Vous n'êtes pas autorisé à consulter cette intervention.",
        );
      }
    }

    // CLIENT role isolation
    if (user && user.role === Role.CLIENT) {
      if (intervention.site?.contract?.clientId !== user.companyId) {
        throw new ForbiddenException(
          "Vous n'avez pas accès à cette intervention",
        );
      }
    }

    return intervention;
  }

  async updateStatus(
    id: number,
    status: InterventionStatus,
    userId: number,
    data?: any,
    user?: any,
  ) {
    const intervention = await this.findOne(id, user);

    const updates: any = { status };
    if (status === InterventionStatus.EN_COURS && !intervention.startTime) {
      updates.startTime = new Date();
    }
    if (status === InterventionStatus.RAPPORT_SOUMIS) {
      updates.endTime = new Date();
      if (data?.report) updates.report = data.report;
      if (data?.signature) updates.signature = data.signature;
      if (data?.clientValidated !== undefined)
        updates.clientValidated = data.clientValidated;
    }
    if (status === InterventionStatus.CLOTUREE) {
      updates.clientValidated = true;
      if (intervention.slaDeadline && intervention.endTime) {
        updates.slaBreached = intervention.endTime > intervention.slaDeadline;
      }

      if (
        intervention.site?.contractId &&
        intervention.startTime &&
        intervention.endTime
      ) {
        const durationHours =
          (intervention.endTime.getTime() - intervention.startTime.getTime()) /
          3600000;
        await this.prisma.contract.update({
          where: { id: intervention.site.contractId },
          data: { usedHours: { increment: durationHours } },
        });
      }
    }

    const updated = await this.prisma.intervention.update({
      where: { id },
      data: updates,
      include: {
        site: { include: { contract: { include: { client: true } } } },
        assignedTechnicians: { select: { id: true, name: true, avatar: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
        squad: { select: { id: true, name: true, color: true } },
        invoice: { select: { id: true, number: true } },
      },
    });

    const resolvedUserId = userId || user?.id || user?.userId;

    if (intervention.requestedById) {
      await this.notificationsService.create({
        userId: intervention.requestedById,
        type: 'STATUT_CHANGE',
        title: 'Statut Mis à Jour',
        message: `Votre intervention ${intervention.reference} est passée à : ${status}`,
        link: `/interventions?id=${intervention.id}`,
      });
    }

    // Emit event for background monitoring (Admins/Broadcasters)
    this.eventEmitter.emit('intervention.status.changed', {
      intervention: updated,
      status,
      previousStatus: intervention.status,
      actorId: resolvedUserId,
    });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'INTERVENTION',
      entityId: id,
      userId: resolvedUserId,
      newValues: { status, ...data },
    });

    // Notify ALL assigned technicians about status change
    for (const tech of intervention.assignedTechnicians) {
      if (tech.id && tech.id !== resolvedUserId) {
        // Don't notify the person who made the change
        await this.notificationsService.create({
          userId: tech.id,
          type: 'STATUT_CHANGE',
          title: 'Mise à jour Statut',
          message: `Mission ${intervention.reference} ${intervention.title} -> ${status}`,
        });
      }
    }

    return updated;
  }

  async update(id: number, dto: any, user?: any) {
    const intervention = await this.findOne(id, user);

    // Security Hardening: Block edits for closed interventions for non-admins
    const isClosed =
      intervention.status === 'CLOTUREE' ||
      intervention.status === 'RAPPORT_SOUMIS';
    const isAdmin =
      user?.role === Role.ADMIN ||
      user?.role === Role.SUPER_ADMIN ||
      user?.role === Role.DIRECTEUR;

    if (isClosed && !isAdmin) {
      throw new ForbiddenException(
        'Une intervention clôturée ne peut plus être modifiée par un technicien.',
      );
    }

    const {
      assignedTechnicians,
      assignedTechnicianIds,
      equipmentId,
      siteId,
      squadId,
      ...rest
    } = dto;

    // Sanitize numeric fields to prevent Prisma NaN crashes
    let finalSiteId = Number(siteId) > 0 ? Number(siteId) : null;
    
    // Auto-assign first site for Client Portal tickets
    if (!finalSiteId && dto.companyId) {
      const firstSite = await this.prisma.site.findFirst({
        where: { contract: { clientId: Number(dto.companyId) } },
        select: { id: true }
      });
      if (firstSite) finalSiteId = firstSite.id;
    }

    const data: any = {
      ...rest,
      siteId: finalSiteId,
      equipmentId:
        Number(equipmentId) > 0
          ? Number(equipmentId)
          : equipmentId === null
            ? null
            : undefined,
      squadId:
        Number(squadId) > 0
          ? Number(squadId)
          : squadId === null
            ? null
            : undefined,
      scheduledDate: dto.scheduledDate
        ? new Date(dto.scheduledDate)
        : dto.scheduledDate === null
          ? null
          : undefined,
      requestedById:
        Number(dto.requestedById) > 0 ? Number(dto.requestedById) : undefined,
      invoiceId: Number(dto.invoiceId) > 0 ? Number(dto.invoiceId) : undefined,
    };

    if (assignedTechnicians && Array.isArray(assignedTechnicians)) {
      data.assignedTechnicians = {
        set: assignedTechnicians.map((tid: number) => ({ id: Number(tid) })),
      };
    }

    const old = await this.prisma.intervention.findUnique({
      where: { id },
      select: {
        assignedTechnicians: { select: { id: true } },
        reference: true,
        title: true,
      },
    });

    const updated = await this.prisma.intervention.update({
      where: { id },
      data,
      include: {
        site: { include: { contract: { include: { client: true } } } },
        assignedTechnicians: { select: { id: true, name: true, avatar: true } },
        requestedBy: { select: { id: true, name: true, avatar: true } },
        squad: { select: { id: true, name: true, color: true } },
        invoice: { select: { id: true, number: true } },
      },
    });

    const resolvedUserId = user?.id || user?.userId;

    // Notify newly added technicians
    if (assignedTechnicians && Array.isArray(assignedTechnicians)) {
      const oldTechIds = old?.assignedTechnicians.map((t) => t.id) || [];
      const newTechIds = assignedTechnicians.filter(
        (tid) => !oldTechIds.includes(Number(tid)),
      );

      for (const techId of newTechIds) {
        if (!isNaN(Number(techId))) {
          await this.notificationsService.create({
            userId: Number(techId),
            type: 'INTERVENTION_CREEE',
            title: 'Nouvelle mission assignée',
            message: `Vous avez été ajouté à l'intervention ${old?.reference}: ${old?.title}`,
            link: `/interventions/${id}`,
          });
        }
      }

      // Notify existing technicians about general updates (title/priority change)
      const existingTechs =
        old?.assignedTechnicians.filter((t) => !newTechIds.includes(t.id)) ||
        [];
      for (const tech of existingTechs) {
        if (tech.id && tech.id !== resolvedUserId) {
          await this.notificationsService.create({
            userId: tech.id,
            type: 'STATUT_CHANGE',
            title: 'Mission mise à jour',
            message: `Détails mis à jour pour ${old?.reference}`,
            link: `/interventions/${id}`,
          });
        }
      }
    }

    // Emit event for broad update handling
    this.eventEmitter.emit('intervention.updated', {
      intervention: updated,
      oldIntervention: old,
      actorId: resolvedUserId,
    });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'INTERVENTION',
      entityId: id,
      userId: resolvedUserId,
      newValues: data,
    });

    return updated;
  }

  async checkSlaBreaches() {
    const now = new Date();
    const breached = await this.prisma.intervention.findMany({
      where: {
        slaBreached: false,
        slaDeadline: { lt: now },
        status: {
          notIn: [InterventionStatus.CLOTUREE, InterventionStatus.ANNULEE],
        },
      },
      include: { assignedTechnicians: { select: { id: true } } },
    });

    for (const intervention of breached) {
      await this.prisma.intervention.update({
        where: { id: intervention.id },
        data: { slaBreached: true },
      });

      // Notify all assigned technicians about SLA breach
      for (const tech of intervention.assignedTechnicians) {
        await this.notificationsService.create({
          userId: tech.id,
          type: 'RETARD_SLA',
          title: '⚠️ SLA Dépassé',
          message: `L'intervention ${intervention.reference} a dépassé son délai SLA. Intervention immédiate requise.`,
          link: `/interventions/${intervention.id}`,
        });
      }
    }

    return { breached: breached.length };
  }

  async getKpis() {
    const [total, byStatus, slaBreached, avgDuration] = await Promise.all([
      this.prisma.intervention.count(),
      this.prisma.intervention.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.intervention.count({ where: { slaBreached: true } }),
      this.prisma.intervention.findMany({
        where: { startTime: { not: null }, endTime: { not: null } },
        select: { startTime: true, endTime: true },
      }),
    ]);

    const totalClosed =
      byStatus.find((s) => s.status === 'CLOTUREE')?._count?.status || 0;
    const slaRate =
      total > 0 ? (((total - slaBreached) / total) * 100).toFixed(1) : '100';

    let avgHours = 0;
    if (avgDuration.length > 0) {
      const totalMs = avgDuration.reduce((acc, i) => {
        return acc + (i.endTime!.getTime() - i.startTime!.getTime());
      }, 0);
      avgHours = Math.round(totalMs / avgDuration.length / 3600000);
    }

    return {
      total,
      byStatus,
      slaBreached,
      slaRatePercent: slaRate,
      totalClosed,
      avgInterventionHours: avgHours,
    };
  }

  async remove(id: number, user?: any) {
    await this.findOne(id, user);
    // Soft delete: set status to ANNULEE instead of deleting from DB
    const deleted = await this.prisma.intervention.update({
      where: { id },
      data: { status: InterventionStatus.ANNULEE },
    });

    await this.auditService.create({
      action: 'DELETE',
      entity: 'INTERVENTION',
      entityId: id,
      userId: user?.id,
    });

    return deleted;
  }
}
