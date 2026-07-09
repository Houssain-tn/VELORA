import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const { contractId, managerId, ...rest } = data;
    const createData = {
      ...rest,
      contract: contractId
        ? { connect: { id: Number(contractId) } }
        : undefined,
      manager: managerId ? { connect: { id: Number(managerId) } } : undefined,
    };
    return this.prisma.site.create({ data: createData });
  }

  async findAll(user?: any) {
    const where: Prisma.SiteWhereInput = {};

    if (user && user.role === 'CLIENT' && user.companyId) {
      where.contract = {
        clientId: user.companyId,
      };
    }

    return this.prisma.site.findMany({
      where,
      include: {
        manager: true,
        contract: {
          include: { client: true },
        },
        equipment: true,
      },
    });
  }

  async findOne(id: number, user?: any) {
    const site = await this.prisma.site.findUnique({
      where: { id },
      include: {
        manager: true,
        contract: {
          include: { client: true },
        },
        equipment: true,
      },
    });

    if (!site) throw new NotFoundException('Site not found');

    // Security Guard: Client A cannot open Client B's site details
    if (user?.role === 'CLIENT' && site.contract?.clientId !== user.companyId) {
      throw new ForbiddenException("Vous n'avez pas accès à ce site");
    }

    return site;
  }

  async update(id: number, data: any) {
    const { contractId, managerId, ...rest } = data;
    const updateData = {
      ...rest,
      contract: contractId
        ? { connect: { id: Number(contractId) } }
        : undefined,
      manager: managerId ? { connect: { id: Number(managerId) } } : undefined,
    };
    return this.prisma.site.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    const equipCount = await this.prisma.equipment.count({
      where: { siteId: id },
    });
    const interCount = await this.prisma.intervention.count({
      where: { siteId: id },
    });

    if (equipCount > 0 || interCount > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce site car il contient des équipements ou des interventions actifs.',
      );
    }
    return this.prisma.site.delete({ where: { id } });
  }
}
