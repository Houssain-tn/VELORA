import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseRequestStatus, Priority, Role } from '@prisma/client';
import {
  CreatePurchaseRequestDto,
  ValidatePurchaseRequestDto,
  RejectPurchaseRequestDto,
  CompletePurchaseDto,
} from './dto/purchases.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePurchaseRequestDto, user: any) {
    const request = await this.prisma.purchaseRequest.create({
      data: {
        title: dto.title,
        description: dto.description,
        justification: dto.justification,
        estimatedCost: dto.estimatedCost,
        priority: dto.priority || Priority.NORMALE,
        projectId: dto.projectId ? Number(dto.projectId) : null,
        siteId: dto.siteId ? Number(dto.siteId) : null,
        requestedById: user.id,
        status: PurchaseRequestStatus.SOUMISE,
        attachmentUrl: dto.attachmentUrl || null,
        attachmentName: dto.attachmentName || null,
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        project: true,
        site: true,
      },
    });

    // Notify all Commercials & Admins
    const staffToNotify = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.COMMERCIAL, Role.ADMIN, Role.SUPER_ADMIN] },
      },
    });

    for (const u of staffToNotify) {
      if (u.id !== user.id) {
        await this.notificationsService.create({
          userId: u.id,
          type: 'STATUT_CHANGE',
          title: "Nouvelle Demande d'Achat",
          message: `${user.name} a soumis une demande d'achat: "${request.title}" (${dto.estimatedCost || 0} DT).`,
          link: '/purchases',
        });
      }
    }

    await this.auditService.create({
      userId: user.id,
      action: 'CREATE',
      entity: 'PurchaseRequest',
      entityId: request.id,
      newValues: { title: request.title, estimatedCost: request.estimatedCost },
    });

    return request;
  }

  async findAll(query: any, user: any) {
    const filters: any = {};

    if (['TECHNICIEN', 'CLIENT'].includes(user.role)) {
      filters.requestedById = user.id;
    }

    const requests = await this.prisma.purchaseRequest.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        commercialValidator: { select: { id: true, name: true } },
        directorValidator: { select: { id: true, name: true } },
        purchasingAgent: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        site: { select: { id: true, name: true } },
      },
    });

    return requests;
  }

  async findOne(id: number, user: any) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        commercialValidator: { select: { id: true, name: true } },
        directorValidator: { select: { id: true, name: true } },
        purchasingAgent: { select: { id: true, name: true } },
        project: true,
        site: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Demande d'achat #${id} introuvable.`);
    }

    if (
      ['TECHNICIEN', 'CLIENT'].includes(user.role) &&
      request.requestedById !== user.id
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à voir cette demande.",
      );
    }

    return request;
  }

  async validateCommercial(
    id: number,
    dto: ValidatePurchaseRequestDto,
    user: any,
  ) {
    const request = await this.findOne(id, user);

    if (request.status !== PurchaseRequestStatus.SOUMISE) {
      throw new ForbiddenException(
        "La demande n'est pas au statut permettant cette validation.",
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.VALIDEE_COMMERCIAL,
        commercialValidatorId: user.id,
        comment: dto.comment || null,
      },
      include: { requestedBy: true },
    });

    await this.notificationsService.create({
      userId: request.requestedById,
      type: 'STATUT_CHANGE',
      title: "Demande d'Achat Validée (Commercial)",
      message: `Votre demande "${request.title}" a été validée par la commerciale ${user.name}. En attente du Directeur.`,
      link: '/purchases',
    });

    const directors = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN] },
      },
    });

    for (const d of directors) {
      await this.notificationsService.create({
        userId: d.id,
        type: 'STATUT_CHANGE',
        title: "Demande d'Achat à Approuver",
        message: `La demande "${request.title}" de ${request.requestedBy.name} a été validée par le Commercial. Signature requise.`,
        link: '/purchases',
      });
    }

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: { status: PurchaseRequestStatus.VALIDEE_COMMERCIAL },
    });

    return updated;
  }

  async validateDirector(
    id: number,
    dto: ValidatePurchaseRequestDto,
    user: any,
  ) {
    const request = await this.findOne(id, user);

    if (request.status !== PurchaseRequestStatus.VALIDEE_COMMERCIAL) {
      throw new ForbiddenException(
        "La demande doit d'abord être validée par le commercial.",
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.VALIDEE_DIRECTEUR,
        directorValidatorId: user.id,
        comment: dto.comment || null,
      },
      include: { requestedBy: true },
    });

    await this.notificationsService.create({
      userId: request.requestedById,
      type: 'STATUT_CHANGE',
      title: "Demande d'Achat Acceptée (Directeur)",
      message: `Félicitations ! Le directeur ${user.name} a signé votre demande "${request.title}". Transmise aux achats.`,
      link: '/purchases',
    });

    const buyers = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.ACHETEUR, Role.ADMIN, Role.SUPER_ADMIN] },
      },
    });

    for (const b of buyers) {
      await this.notificationsService.create({
        userId: b.id,
        type: 'STATUT_CHANGE',
        title: 'Nouvelle Commande à Traiter',
        message: `La demande "${request.title}" de ${request.requestedBy.name} est validée par la Direction. À approvisionner.`,
        link: '/purchases',
      });
    }

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: { status: PurchaseRequestStatus.VALIDEE_DIRECTEUR },
    });

    return updated;
  }

  async processPurchase(id: number, user: any) {
    const request = await this.findOne(id, user);

    if (request.status !== PurchaseRequestStatus.VALIDEE_DIRECTEUR) {
      throw new ForbiddenException(
        "La demande n'a pas reçu la validation finale de la direction.",
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.EN_COURS_ACHAT,
        purchasingAgentId: user.id,
      },
    });

    await this.notificationsService.create({
      userId: request.requestedById,
      type: 'STATUT_CHANGE',
      title: 'Achat en Cours de Traitement',
      message: `Votre demande "${request.title}" est en cours de traitement / approvisionnement.`,
      link: '/purchases',
    });

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: { status: PurchaseRequestStatus.EN_COURS_ACHAT },
    });

    return updated;
  }

  async completePurchase(id: number, dto: CompletePurchaseDto, user: any) {
    const request = await this.findOne(id, user);

    if (request.status !== PurchaseRequestStatus.EN_COURS_ACHAT) {
      throw new ForbiddenException(
        "La demande n'est pas en cours de traitement d'achat.",
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.TERMINEE,
        actualCost: dto.actualCost,
      },
    });

    if (dto.convertToAsset && dto.assetType && dto.assetData) {
      if (dto.assetType === 'FIXED_ASSET') {
        // Use timestamp-based code to guarantee uniqueness (no Math.random() collision risk)
        const timestamp = Date.now().toString(36).toUpperCase();
        const code = `FA-${new Date().getFullYear()}-${timestamp}`;
        await this.prisma.fixedAsset.create({
          data: {
            code,
            designation: request.title,
            category: dto.assetData.category || 'AUTRE',
            acquisitionDate: new Date(),
            acquisitionValue: dto.actualCost,
            netBookValue: dto.actualCost,
            siteId: request.siteId,
          },
        });
      } else if (dto.assetType === 'VEHICLE') {
        await this.prisma.vehicle.create({
          data: {
            immatriculation: dto.assetData.immatriculation,
            marque: dto.assetData.marque,
            modele: dto.assetData.modele,
            annee: dto.assetData.annee
              ? parseInt(dto.assetData.annee, 10)
              : new Date().getFullYear(),
            fuelType: dto.assetData.fuelType || 'DIESEL',
            acquisitionDate: new Date(),
            acquisitionCost: dto.actualCost,
            siteId: request.siteId,
          },
        });
      } else if (dto.assetType === 'OFFICE_SUPPLY') {
        const qty = dto.assetData.quantity
          ? parseInt(dto.assetData.quantity, 10)
          : 1;
        await this.prisma.officeSupply.create({
          data: {
            name: request.title,
            category: 'Fournitures Diverses',
            currentStock: qty,
            unit: dto.assetData.unit || 'Unités',
            unitCost: qty > 0 ? dto.actualCost / qty : dto.actualCost,
            lastOrderDate: new Date(),
          },
        });
      }
    }

    await this.notificationsService.create({
      userId: request.requestedById,
      type: 'STATUT_CHANGE',
      title: 'Achat Livré / Terminé',
      message: `Votre achat "${request.title}" a été finalisé et réceptionné.`,
      link: '/purchases',
    });

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: {
        status: PurchaseRequestStatus.TERMINEE,
        actualCost: dto.actualCost,
      },
    });

    return updated;
  }

  async reject(id: number, dto: RejectPurchaseRequestDto, user: any) {
    const request = await this.findOne(id, user);

    if (
      request.status === PurchaseRequestStatus.TERMINEE ||
      request.status === PurchaseRequestStatus.REJETEE
    ) {
      throw new ForbiddenException(
        'Cette demande est déjà clôturée ou rejetée.',
      );
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.REJETEE,
        comment: dto.comment,
      },
    });

    await this.notificationsService.create({
      userId: request.requestedById,
      type: 'STATUT_CHANGE',
      title: "Demande d'Achat Refusée",
      message: `Votre demande "${request.title}" a été refusée. Motif: ${dto.comment}`,
      link: '/purchases',
    });

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: {
        status: PurchaseRequestStatus.REJETEE,
        comment: dto.comment,
      },
    });

    return updated;
  }

  async update(id: number, dto: CreatePurchaseRequestDto, user: any) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Demande d'achat #${id} introuvable.`);
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        justification: dto.justification,
        estimatedCost: dto.estimatedCost,
        priority: dto.priority || request.priority,
        projectId: dto.projectId ? Number(dto.projectId) : null,
        siteId: dto.siteId ? Number(dto.siteId) : null,
        attachmentUrl: dto.attachmentUrl || request.attachmentUrl,
        attachmentName: dto.attachmentName || request.attachmentName,
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        project: true,
        site: true,
      },
    });

    await this.auditService.create({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseRequest',
      entityId: id,
      newValues: { title: updated.title, estimatedCost: updated.estimatedCost },
    });

    return updated;
  }

  async remove(id: number, user: any) {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
    });
    if (!request) {
      throw new NotFoundException(`Demande d'achat #${id} introuvable.`);
    }

    await this.prisma.purchaseRequest.delete({ where: { id } });

    await this.auditService.create({
      userId: user.id,
      action: 'DELETE',
      entity: 'PurchaseRequest',
      entityId: id,
      oldValues: { title: request.title },
    });

    return { success: true };
  }
}
