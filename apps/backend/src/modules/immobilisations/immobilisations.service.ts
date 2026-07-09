import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ImmobilisationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FixedAssetCreateInput) {
    // Auto-calculate netBookValue on creation
    const netBookValue =
      (data.acquisitionValue as number) -
      ((data.accumulatedDepreciation as number) ?? 0);
    return this.prisma.fixedAsset.create({
      data: { ...data, netBookValue },
      include: { site: true, custodian: true, amortizationLogs: true },
    });
  }

  async findAll(query?: {
    category?: string;
    status?: string;
    siteId?: number;
  }) {
    const where: Prisma.FixedAssetWhereInput = {};
    if (query?.category) where.category = query.category as any;
    if (query?.status) where.status = query.status as any;
    if (query?.siteId) where.siteId = Number(query.siteId);
    return this.prisma.fixedAsset.findMany({
      where,
      include: { site: true, custodian: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id },
      include: { site: true, custodian: true, amortizationLogs: { orderBy: { year: 'asc' } } },
    });
    if (!asset) throw new NotFoundException(`FixedAsset #${id} not found`);
    return asset;
  }

  async update(id: number, data: Prisma.FixedAssetUpdateInput) {
    // Recalculate netBookValue if relevant fields change
    const current = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!current) throw new NotFoundException(`FixedAsset #${id} not found`);
    const acqVal =
      (data.acquisitionValue as number) ?? Number(current.acquisitionValue);
    const amortAcc =
      (data.accumulatedDepreciation as number) ??
      Number(current.accumulatedDepreciation);
    const netBookValue = acqVal - amortAcc;
    return this.prisma.fixedAsset.update({
      where: { id },
      data: { ...data, netBookValue },
      include: { site: true, custodian: true },
    });
  }

  async remove(id: number) {
    const asset = await this.prisma.fixedAsset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException(`FixedAsset #${id} not found`);
    return this.prisma.fixedAsset.delete({ where: { id } });
  }

  async getStats() {
    const assets = await this.prisma.fixedAsset.findMany();
    const totalGrossValue = assets.reduce(
      (s, a) => s + Number(a.acquisitionValue),
      0,
    );
    const totalDepreciation = assets.reduce(
      (s, a) => s + Number(a.accumulatedDepreciation),
      0,
    );
    const totalNetValue = assets.reduce(
      (s, a) => s + Number(a.netBookValue),
      0,
    );
    const totalCurrentYear = assets.reduce(
      (s, a) => s + Number(a.currentYearDepreciation),
      0,
    );
    const activeCount = assets.filter((a) => a.status === 'EN_SERVICE').length;
    const byCategory = assets.reduce(
      (acc, a) => {
        acc[a.category] = (acc[a.category] || 0) + Number(a.acquisitionValue);
        return acc;
      },
      {} as Record<string, number>,
    );
    return {
      totalGrossValue,
      totalDepreciation,
      totalNetValue,
      totalCurrentYear,
      activeCount,
      byCategory,
      total: assets.length,
    };
  }
}
