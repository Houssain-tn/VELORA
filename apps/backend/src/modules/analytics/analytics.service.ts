import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Global dashboard KPIs
   */
  /**
   * Global dashboard KPIs
   */
  /**
   * Dashboard KPIs (Global or Company-specific)
   */
  async getDashboardKpis(companyId?: number) {
    try {
      const whereFilter = companyId
        ? { site: { contract: { clientId: companyId } } }
        : {};
      const siteFilter = companyId ? { contract: { clientId: companyId } } : {};
      const companyFilter = companyId ? { id: companyId } : {};

      const firstDayOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );

      const [
        totalInterventions,
        openInterventions,
        slaBreached,
        totalTasks,
        tasksDone,
        totalSites,
        activeTechnicians,
        interventionKpi,
        interventionsLast7Days,
        pendingBillingCount,
        monthlyInvoicedRevenue,
      ] = await Promise.all([
        this.prisma.intervention.count({ where: whereFilter }),
        this.prisma.intervention.count({
          where: { ...whereFilter, status: { notIn: ['CLOTUREE', 'ANNULEE'] } },
        }),
        this.prisma.intervention.count({
          where: { ...whereFilter, slaBreached: true },
        }),
        this.prisma.task.count({ where: whereFilter }),
        this.prisma.task.count({
          where: { ...whereFilter, status: 'TERMINE' },
        }),
        this.prisma.site.count({ where: siteFilter }),
        this.prisma.user.count({
          where: { role: 'TECHNICIEN', isActive: true },
        }),
        this.prisma.intervention.findMany({
          where: {
            ...whereFilter,
            status: { not: 'ANNULEE' },
            startTime: { not: null },
            endTime: { not: null },
          },
          select: { startTime: true, endTime: true, slaBreached: true },
        }),
        this.getInterventionsLast7Days(companyId),
        this.prisma.intervention.count({
          where: {
            ...whereFilter,
            status: 'CLOTUREE',
            billable: true,
            invoiceId: null,
          },
        }),
        this.prisma.invoice.aggregate({
          where: {
            clientId: companyId, // Direct filtering for better performance and accuracy
            createdAt: { gte: firstDayOfMonth },
          },
          _sum: { totalTTC: true },
        }),
      ]);

      const [slaBurnDown, siteHealthScores] = await Promise.all([
        this.getSlaBurnDown(companyId),
        this.getSiteHealthScores(companyId),
      ]);

      const slaRate =
        totalInterventions > 0
          ? (
              ((totalInterventions - slaBreached) / totalInterventions) *
              100
            ).toFixed(1)
          : '100';

      let avgDurationHours = 0;
      if (interventionKpi.length > 0) {
        const totalMs = interventionKpi.reduce(
          (acc, i) => acc + (i.endTime!.getTime() - i.startTime!.getTime()),
          0,
        );
        avgDurationHours = +(
          totalMs /
          interventionKpi.length /
          3600000
        ).toFixed(1);
      }

      return {
        interventions: {
          total: totalInterventions,
          open: openInterventions,
          slaBreached,
        },
        tasks: {
          total: totalTasks,
          done: tasksDone,
          completionRate:
            totalTasks > 0 ? +((tasksDone / totalTasks) * 100).toFixed(1) : 0,
        },
        sites: totalSites,
        technicians: activeTechnicians,
        slaRatePercent: Number(slaRate),
        avgInterventionHours: avgDurationHours,
        interventionsLast7Days,
        slaBurnDown,
        siteHealthScores,
        billing: {
          pendingCount: pendingBillingCount,
          monthlyRevenue: monthlyInvoicedRevenue._sum.totalTTC || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in getDashboardKpis', error);
      throw error;
    }
  }

  private async getSlaBurnDown(companyId?: number) {
    const whereFilter = companyId
      ? { site: { contract: { clientId: companyId } } }
      : {};
    return this.prisma.intervention.findMany({
      where: {
        ...whereFilter,
        status: { notIn: ['CLOTUREE', 'ANNULEE'] },
        slaDeadline: { not: null, gte: new Date() },
      },
      orderBy: { slaDeadline: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slaDeadline: true,
        priority: true,
        site: { select: { name: true } },
      },
    });
  }

  private async getSiteHealthScores(companyId?: number) {
    const siteFilter = companyId ? { contract: { clientId: companyId } } : {};
    const sites = await this.prisma.site.findMany({
      where: siteFilter,
      include: {
        _count: {
          select: {
            interventions: {
              where: { status: { notIn: ['CLOTUREE', 'ANNULEE'] } },
            },
          },
        },
        interventions: {
          where: {
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) },
          },
          select: { slaBreached: true },
        },
      },
    });

    return sites.map((site) => {
      const pendingCount = site._count.interventions;
      const recentFailures = site.interventions.length;
      const slaBreaches = site.interventions.filter(
        (i) => i.slaBreached,
      ).length;

      // Logic: Start at 100, deduct based on backlog and failures
      let score =
        100 - pendingCount * 4 - recentFailures * 2 - slaBreaches * 10;
      score = Math.max(0, Math.min(100, score));

      return {
        id: site.id,
        name: site.name,
        score,
        status: score > 80 ? 'HEALTHY' : score > 50 ? 'WARNING' : 'CRITICAL',
      };
    });
  }

  private async getInterventionsLast7Days(companyId?: number) {
    const days: Date[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }

    const startOf7Days = days[0];
    const whereFilter = companyId
      ? { site: { contract: { clientId: companyId } } }
      : {};

    const [created, resolved] = await Promise.all([
      this.prisma.intervention.findMany({
        where: { ...whereFilter, createdAt: { gte: startOf7Days } },
        select: { createdAt: true },
      }),
      this.prisma.intervention.findMany({
        where: { ...whereFilter, endTime: { gte: startOf7Days } },
        select: { endTime: true },
      }),
    ]);

    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    return days.map((day) => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const ouvertes = created.filter(
        (i) => i.createdAt >= day && i.createdAt <= dayEnd,
      ).length;

      const resolues = resolved.filter(
        (i) => i.endTime! >= day && i.endTime! <= dayEnd,
      ).length;

      return {
        name: dayNames[day.getDay()],
        ouvertes,
        resolues,
        date: day.toISOString().split('T')[0],
      };
    });
  }

  /**
   * Interventions per month (last 6 months)
   */
  async getInterventionsByMonth(companyId?: number) {
    const whereFilter = companyId
      ? { site: { contract: { clientId: companyId } } }
      : {};
    const interventions = await this.prisma.intervention.findMany({
      select: { createdAt: true, status: true, slaBreached: true },
      where: {
        ...whereFilter,
        createdAt: {
          gte: new Date(Date.now() - 6 * 30 * 24 * 3600 * 1000),
        },
      },
    });

    const byMonth: Record<string, { total: number; slaOk: number }> = {};
    interventions.forEach((i) => {
      const month = i.createdAt.toISOString().slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { total: 0, slaOk: 0 };
      byMonth[month].total++;
      if (!i.slaBreached) byMonth[month].slaOk++;
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data }));
  }

  /**
   * Technician performance: interventions closed per technician
   */
  async getTechnicianPerformance(companyId?: number) {
    const whereFilter = companyId
      ? { site: { contract: { clientId: companyId } } }
      : {};

    // Since it's Many-to-Many, we fetch closed interventions and their teams
    const interventions = await this.prisma.intervention.findMany({
      where: { ...whereFilter, status: 'CLOTUREE' },
      select: {
        assignedTechnicians: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    const performanceMap: Record<number, { technician: any; closed: number }> =
      {};

    interventions.forEach((inv) => {
      inv.assignedTechnicians.forEach((tech) => {
        if (!performanceMap[tech.id]) {
          performanceMap[tech.id] = { technician: tech, closed: 0 };
        }
        performanceMap[tech.id].closed++;
      });
    });

    return Object.values(performanceMap).sort((a, b) => b.closed - a.closed);
  }

  /**
   * Most frequent failure equipment
   */
  async getFrequentFailures(companyId?: number) {
    const whereFilter = companyId
      ? { site: { contract: { clientId: companyId } } }
      : {};
    return this.prisma.intervention.groupBy({
      by: ['equipmentId'],
      where: {
        ...whereFilter,
        equipmentId: { not: null },
        type: { in: ['INCIDENT', 'MAINTENANCE_CORRECTIVE'] },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
  }

  /**
   * Site-level stats
   */
  async getSiteStats(companyId?: number) {
    const siteFilter = companyId ? { contract: { clientId: companyId } } : {};
    const sites = await this.prisma.site.findMany({
      where: siteFilter,
      include: {
        _count: {
          select: { interventions: true, tasks: true, equipment: true },
        },
      },
    });
    return sites.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      interventionsCount: s._count.interventions,
      tasksCount: s._count.tasks,
      equipmentCount: s._count.equipment,
    }));
  }
}
