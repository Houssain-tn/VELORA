import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MoyensGenerauxService {
  constructor(private prisma: PrismaService) {}

  // ─── SERVICE REQUESTS ───
  private generateReference(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `MG-${year}-${random}`;
  }

  async createServiceRequest(data: Prisma.ServiceRequestCreateInput) {
    if (!data.reference) data.reference = this.generateReference();
    return this.prisma.serviceRequest.create({ data, include: { site: true } });
  }

  async findAllServiceRequests(query?: {
    status?: string;
    category?: string;
    siteId?: number;
  }) {
    const where: Prisma.ServiceRequestWhereInput = {};
    if (query?.status) where.status = query.status as any;
    if (query?.category) where.category = query.category as any;
    if (query?.siteId) where.siteId = Number(query.siteId);
    return this.prisma.serviceRequest.findMany({
      where,
      include: { site: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneServiceRequest(id: number) {
    const req = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: { site: true },
    });
    if (!req) throw new NotFoundException(`ServiceRequest #${id} not found`);
    return req;
  }

  async updateServiceRequest(
    id: number,
    data: Prisma.ServiceRequestUpdateInput,
  ) {
    const req = await this.prisma.serviceRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException(`ServiceRequest #${id} not found`);
    if (data.status === 'RESOLU' && !req.resolvedAt) {
      (data as any).resolvedAt = new Date();
    }
    return this.prisma.serviceRequest.update({
      where: { id },
      data,
      include: { site: true },
    });
  }

  async removeServiceRequest(id: number) {
    return this.prisma.serviceRequest.delete({ where: { id } });
  }

  // ─── SUPPLIERS ───
  async createSupplier(data: Prisma.SupplierCreateInput) {
    return this.prisma.supplier.create({ data });
  }

  async findAllSuppliers(contractStatus?: string) {
    return this.prisma.supplier.findMany({
      where: contractStatus ? { contractStatus: contractStatus as any } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findOneSupplier(id: number) {
    const s = await this.prisma.supplier.findUnique({ where: { id } });
    if (!s) throw new NotFoundException(`Supplier #${id} not found`);
    return s;
  }

  async updateSupplier(id: number, data: Prisma.SupplierUpdateInput) {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async removeSupplier(id: number) {
    return this.prisma.supplier.delete({ where: { id } });
  }

  // ─── OFFICE SUPPLIES ───
  async createOfficeSupply(data: Prisma.OfficeSupplyCreateInput) {
    return this.prisma.officeSupply.create({ data });
  }

  async findAllOfficeSupplies(lowStockOnly?: boolean) {
    if (lowStockOnly) {
      return this.prisma.officeSupply.findMany({
        where: {
          currentStock: { lte: this.prisma.officeSupply.fields.minStock },
        },
        orderBy: { name: 'asc' },
      });
    }
    return this.prisma.officeSupply.findMany({ orderBy: { name: 'asc' } });
  }

  async updateOfficeSupply(id: number, data: Prisma.OfficeSupplyUpdateInput) {
    return this.prisma.officeSupply.update({ where: { id }, data });
  }

  async removeOfficeSupply(id: number) {
    return this.prisma.officeSupply.delete({ where: { id } });
  }

  // ─── COMPANY SPACES ───
  async createSpace(data: Prisma.CompanySpaceCreateInput) {
    return this.prisma.companySpace.create({ data, include: { site: true } });
  }

  async findAllSpaces(type?: string, status?: string) {
    const where: Prisma.CompanySpaceWhereInput = {};
    if (type) where.type = type as any;
    if (status) where.status = status as any;
    return this.prisma.companySpace.findMany({
      where,
      include: { site: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateSpace(id: number, data: Prisma.CompanySpaceUpdateInput) {
    return this.prisma.companySpace.update({ where: { id }, data });
  }

  async removeSpace(id: number) {
    return this.prisma.companySpace.delete({ where: { id } });
  }

  // ─── STATS ───
  async getStats() {
    const [requests, suppliers, supplies, spaces] = await Promise.all([
      this.prisma.serviceRequest.findMany(),
      this.prisma.supplier.findMany(),
      this.prisma.officeSupply.findMany(),
      this.prisma.companySpace.findMany(),
    ]);
    const openRequests = requests.filter(
      (r) => r.status === 'EN_COURS' || r.status === 'EN_ATTENTE',
    ).length;
    const resolvedRequests = requests.filter(
      (r) => r.status === 'RESOLU',
    ).length;
    const activeSuppliers = suppliers.filter(
      (s) => s.contractStatus === 'ACTIF',
    ).length;
    const lowStockCount = supplies.filter(
      (s) => s.currentStock <= s.minStock,
    ).length;
    const totalMonthlyBudget = suppliers.reduce(
      (sum, s) => sum + Number(s.monthlyBudget || 0),
      0,
    );
    return {
      openRequests,
      resolvedRequests,
      activeSuppliers,
      lowStockCount,
      totalMonthlyBudget,
      totalSuppliers: suppliers.length,
      totalSupplies: supplies.length,
      totalSpaces: spaces.length,
    };
  }
}
