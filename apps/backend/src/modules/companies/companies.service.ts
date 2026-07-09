import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { users: true, contracts: true, invoices: true },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { 
        users: { select: { id: true, name: true, email: true, isActive: true, role: true } }, 
        contracts: true, 
        invoices: true 
      },
    });
  }

  async create(data: any) {
    return this.prisma.company.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const contracts = await this.prisma.contract.count({
      where: { clientId: id },
    });
    const users = await this.prisma.user.count({
      where: { companyId: id },
    });

    if (contracts > 0 || users > 0) {
      throw new ConflictException(
        'Impossible de supprimer une entreprise avec des contrats ou des utilisateurs actifs.',
      );
    }

    return this.prisma.company.delete({ where: { id } });
  }
}
