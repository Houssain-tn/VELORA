import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @OnEvent('intervention.created')
  async handleInterventionCreated(payload: {
    intervention: any;
    actorId: number;
    actorRole: string;
  }) {
    this.logger.log(
      `Event captured: intervention.created [ID: ${payload.intervention.id}]`,
    );

    // 1. If created by a CLIENT: Notify all ADMINS and SUPER_ADMINS (Priority: Critical Alert)
    if (payload.actorRole === 'CLIENT') {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN', 'DIRECTEUR'] },
          isActive: true,
        },
      });

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: 'INTERVENTION_CREEE',
          title: 'Nouvelle Demande Client',
          message: `${payload.intervention.reference} ${payload.intervention.title} (${payload.intervention.priority})`,
          link: `/interventions?id=${payload.intervention.id}`,
        });
      }
    }
    // 2. If created by Admin/Tech: Notify Assigned Technicians
    else if (
      payload.intervention.assignedTechnicians &&
      payload.intervention.assignedTechnicians.length > 0
    ) {
      for (const tech of payload.intervention.assignedTechnicians) {
        // Don't notify the actor who created it
        if (tech.id === payload.actorId) continue;

        await this.notificationsService.create({
          userId: tech.id,
          type: 'INTERVENTION_CREEE',
          title:
            payload.intervention.priority === 'URGENTE'
              ? 'Alerte Urgence'
              : 'Nouvelle Affectation',
          message: `Assignation : ${payload.intervention.reference} ${payload.intervention.title}`,
          link: `/interventions?id=${payload.intervention.id}`,
        });
      }
    }
  }

  @OnEvent('project.created')
  async handleProjectCreated(payload: { project: any; actorId: number }) {
    this.logger.log(
      `Event captured: project.created [ID: ${payload.project.id}]`,
    );

    // Notify all Admins that a new project was initiated (except the creator)
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN', 'DIRECTEUR'] },
        isActive: true,
        id: { not: payload.actorId },
      },
    });

    for (const admin of admins) {
      await this.notificationsService.create({
        userId: admin.id,
        type: 'STATUT_CHANGE',
        title: 'Lancement de Projet',
        message: `Le projet "${payload.project.name}" vient d'être démarré.`,
        link: `/projects?id=${payload.project.id}`,
      });
    }
  }

  @OnEvent('comment.created')
  async handleCommentCreated(payload: { comment: any; actorId: number }) {
    this.logger.log(
      `Event captured: comment.created [ID: ${payload.comment.id}]`,
    );
    const { comment, actorId } = payload;
    const isIntervention = !!comment.interventionId;

    if (isIntervention && comment.intervention) {
      const { requestedById, assignedTechnicians, reference } =
        comment.intervention;
      // techIds format might depend entirely on prisma include
      const techIds = assignedTechnicians.map((t: any) => t.id);

      // Notify requester and all assigned technicians EXCEPT the one writing the note
      const recipients = new Set(
        [...techIds, requestedById].filter((id) => id && id !== actorId),
      );

      for (const recipientId of recipients) {
        await this.notificationsService.create({
          userId: Number(recipientId),
          type: 'COMMENTAIRE',
          title: 'Nouveau commentaire de suivi',
          message: `${comment.user.name} a ajouté une note sur l'intervention ${reference}.`,
          link: `/interventions/${comment.interventionId}`,
        });
      }
    } else if (comment.taskId && comment.task) {
      const { createdById, assignedTechnicians, title } = comment.task;
      const techIds = assignedTechnicians.map((t: any) => t.id);

      // Notify task creator and assigned technicians EXCEPT the one writing the note
      const recipients = new Set(
        [...techIds, createdById].filter((id) => id && id !== actorId),
      );

      for (const recipientId of recipients) {
        await this.notificationsService.create({
          userId: Number(recipientId),
          type: 'COMMENTAIRE',
          title: 'Note de tâche ajoutée',
          message: `${comment.user.name} a commenté la tâche Kanban "${title}".`,
          link: `/task-tracking`,
        });
      }
    }
  }

  @OnEvent('meeting.created')
  async handleMeetingCreated(payload: {
    meeting: any;
    actorId: number;
    actorRole: string;
  }) {
    this.logger.log(
      `Event captured: meeting.created [ID: ${payload.meeting.id}]`,
    );
    const { meeting, actorId, actorRole } = payload;

    // 1. Notify Admins if client created it
    if (actorRole === 'CLIENT') {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN', 'DIRECTEUR'] },
          isActive: true,
        },
      });

      for (const admin of admins) {
        await this.notificationsService.create({
          userId: admin.id,
          type: 'MEETING_REQUEST',
          title: 'Nouvelle Demande de Réunion',
          message: `Le client ${meeting.createdBy.name} a demandé : ${meeting.title}`,
          link: `/meetings`,
        });
      }
    }

    // 2. Notify Participants if already scheduled
    if (meeting.status === 'SCHEDULED' && meeting.participants) {
      for (const p of meeting.participants) {
        if (p.id === actorId) continue;
        await this.notificationsService.create({
          userId: p.id,
          type: 'MEETING_SCHEDULED',
          title: 'Réunion Programmée',
          message: `Vous êtes invité à : ${meeting.title}`,
          link: `/meetings`,
        });
      }
    }
  }

  @OnEvent('meeting.updated')
  async handleMeetingUpdated(payload: {
    meeting: any;
    previousStatus: string;
    actorId: number;
  }) {
    this.logger.log(
      `Event captured: meeting.updated [ID: ${payload.meeting.id}]`,
    );
    const { meeting, previousStatus, actorId } = payload;

    // Notify participants if status changed to SCHEDULED
    if (
      meeting.status === 'SCHEDULED' &&
      previousStatus !== 'SCHEDULED' &&
      meeting.participants
    ) {
      for (const p of meeting.participants) {
        if (p.id === actorId) continue;
        await this.notificationsService.create({
          userId: p.id,
          type: 'MEETING_SCHEDULED',
          title: 'Réunion Confirmée',
          message: `La réunion "${meeting.title}" est maintenant confirmée.`,
          link: `/meetings`,
        });
      }
    }
  }

  @OnEvent('task.created')
  async handleTaskCreated(payload: { task: any; actorId: number }) {
    this.logger.log(`Event captured: task.created [ID: ${payload.task.id}]`);
    const { task, actorId } = payload;

    if (task.assignedTechnicians) {
      for (const tech of task.assignedTechnicians) {
        if (tech.id === actorId) continue;
        await this.notificationsService.create({
          userId: Number(tech.id),
          type: 'TACHE_ASSIGNEE',
          title: 'Nouveau chantier assigné',
          message: `Vous avez été ajouté à la tâche : ${task.title}`,
          link: `/task-tracking`,
        });
      }
    }
  }

  @OnEvent('task.updated')
  async handleTaskUpdated(payload: {
    task: any;
    oldTask: any;
    actorId: number;
  }) {
    this.logger.log(`Event captured: task.updated [ID: ${payload.task.id}]`);
    const { task, oldTask, actorId } = payload;

    if (task.assignedTechnicians) {
      const oldTechIds =
        oldTask?.assignedTechnicians?.map((t: any) => t.id) || [];
      const newTechs = task.assignedTechnicians.filter(
        (t: any) => !oldTechIds.includes(t.id) && t.id !== actorId,
      );

      for (const tech of newTechs) {
        await this.notificationsService.create({
          userId: Number(tech.id),
          type: 'TACHE_ASSIGNEE',
          title: 'Nouvelle tâche assignée',
          message: `Vous avez été ajouté au chantier : ${task.title}`,
          link: `/task-tracking`,
        });
      }
    }
  }
}
