import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ParcAutoService {
  constructor(private prisma: PrismaService) {}

  // --- VEHICLES ---
  async createVehicle(data: Prisma.VehicleCreateInput) {
    return this.prisma.vehicle.create({
      data,
      include: { site: true, driver: true, fuelLogs: true, missions: true },
    });
  }

  async findAllVehicles(query?: { status?: string; siteId?: number }) {
    const where: Prisma.VehicleWhereInput = {};
    if (query?.status) where.status = query.status as any;
    if (query?.siteId) where.siteId = Number(query.siteId);
    return this.prisma.vehicle.findMany({
      where,
      include: {
        site: true,
        driver: true,
        fuelLogs: { orderBy: { date: 'desc' }, take: 5 },
        missions: { orderBy: { startDate: 'desc' }, take: 3 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneVehicle(id: number) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        site: true,
        driver: true,
        fuelLogs: { orderBy: { date: 'desc' } },
        missions: { orderBy: { startDate: 'desc' } },
      },
    });
    if (!v) throw new NotFoundException(`Vehicle #${id} not found`);
    return v;
  }

  async updateVehicle(id: number, data: Prisma.VehicleUpdateInput) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException(`Vehicle #${id} not found`);
    return this.prisma.vehicle.update({
      where: { id },
      data,
      include: { site: true, driver: true },
    });
  }

  async removeVehicle(id: number) {
    const v = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!v) throw new NotFoundException(`Vehicle #${id} not found`);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  // --- FUEL LOGS ---
  async createFuelLog(data: Prisma.FuelLogCreateInput) {
    const log = await this.prisma.fuelLog.create({
      data,
      include: { vehicle: true },
    });
    // Update vehicle kilometrage if new mileage is higher
    if (log.mileage > (log.vehicle.kilometrage || 0)) {
      await this.prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: { kilometrage: log.mileage },
      });
    }
    return log;
  }

  async findAllFuelLogs(vehicleId?: number) {
    return this.prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId } : {},
      include: { vehicle: true },
      orderBy: { date: 'desc' },
    });
  }

  async deleteFuelLog(id: number) {
    return this.prisma.fuelLog.delete({ where: { id } });
  }

  // --- MISSIONS ---
  async createMission(data: Prisma.VehicleMissionCreateInput) {
    const mission = await this.prisma.vehicleMission.create({
      data,
      include: { vehicle: true, driver: true },
    });
    // Mark vehicle as EN_MISSION if starting
    if (mission.status === 'EN_COURS') {
      await this.prisma.vehicle.update({
        where: { id: mission.vehicleId },
        data: { status: 'EN_MISSION' },
      });
    }
    return mission;
  }

  async findAllMissions(vehicleId?: number) {
    return this.prisma.vehicleMission.findMany({
      where: vehicleId ? { vehicleId } : {},
      include: { vehicle: true, driver: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async updateMission(id: number, data: Prisma.VehicleMissionUpdateInput) {
    const mission = await this.prisma.vehicleMission.update({
      where: { id },
      data,
      include: { vehicle: true, driver: true },
    });
    // If mission is completed, revert vehicle to DISPONIBLE and update km
    if (mission.status === 'TERMINEE' && mission.kmEnd) {
      await this.prisma.vehicle.update({
        where: { id: mission.vehicleId },
        data: {
          status: 'DISPONIBLE',
          kilometrage: mission.kmEnd,
        },
      });
    }
    return mission;
  }

  async deleteMission(id: number) {
    return this.prisma.vehicleMission.delete({ where: { id } });
  }

  // --- STATS ---
  async getFleetStats() {
    const vehicles = await this.prisma.vehicle.findMany();
    const fuelLogs = await this.prisma.fuelLog.findMany();
    const missions = await this.prisma.vehicleMission.findMany();
    const byStatus = vehicles.reduce(
      (acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const totalFuelCost = fuelLogs.reduce((s, f) => s + Number(f.totalCost), 0);
    const totalKm = vehicles.reduce((s, v) => s + v.kilometrage, 0);
    const alertsCount = vehicles.filter((v) => {
      const now = new Date();
      const soon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const assuranceExp =
        v.assuranceExpiry && new Date(v.assuranceExpiry) < soon;
      const vtExp = v.visiteTechnique && new Date(v.visiteTechnique) < soon;
      return assuranceExp || vtExp;
    }).length;
    return {
      total: vehicles.length,
      byStatus,
      totalFuelCost,
      totalKm,
      alertsCount,
      activeMissions: missions.filter((m) => m.status === 'EN_COURS').length,
    };
  }
}
