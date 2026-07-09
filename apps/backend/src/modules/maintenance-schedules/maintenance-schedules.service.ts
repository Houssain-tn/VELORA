import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Frequency,
  InterventionStatus,
  InterventionType,
  Priority,
} from '@prisma/client';
import { addMonths, addYears, isBefore, startOfDay } from 'date-fns';

@Injectable()
export class MaintenanceSchedulesService {
  private readonly logger = new Logger(MaintenanceSchedulesService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const {
      siteId,
      equipmentId,
      assignedToId,
      startDate,
      frequency,
      billable,
      ...rest
    } = data;

    return this.prisma.maintenanceSchedule.create({
      data: {
        ...rest,
        frequency,
        billable: !!billable,
        startDate: new Date(startDate),
        nextDueDate: new Date(startDate),
        site: { connect: { id: Number(siteId) } },
        equipment: equipmentId
          ? { connect: { id: Number(equipmentId) } }
          : undefined,
        assignedTo: assignedToId
          ? { connect: { id: Number(assignedToId) } }
          : undefined,
      },
      include: { site: true, equipment: true, assignedTo: true },
    });
  }

  async findAll() {
    return this.prisma.maintenanceSchedule.findMany({
      include: { site: true, equipment: true, assignedTo: true },
    });
  }

  async update(id: number, data: any) {
    const { siteId, equipmentId, assignedToId, ...rest } = data;
    return this.prisma.maintenanceSchedule.update({
      where: { id },
      data: {
        ...rest,
        site: siteId ? { connect: { id: Number(siteId) } } : undefined,
        equipment: equipmentId
          ? { connect: { id: Number(equipmentId) } }
          : undefined,
        assignedTo: assignedToId
          ? { connect: { id: Number(assignedToId) } }
          : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.maintenanceSchedule.delete({ where: { id } });
  }

  /**
   * PPM ENGINE: Runs every day at 1 AM
   * Generates interventions for schedules due in the next 7 days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handlePPMGeneration() {
    this.logger.log('🚀 PPM Engine: Starting automated generation...');

    const horizon = addMonths(new Date(), 1); // Check schedules due in the next month
    const schedules = await this.prisma.maintenanceSchedule.findMany({
      where: {
        status: 'ACTIVE',
        nextDueDate: { lte: horizon },
      },
      include: { site: true, equipment: true, assignedTo: true },
    });

    this.logger.log(`🔍 Found ${schedules.length} active schedules due soon.`);

    for (const schedule of schedules) {
      await this.generateInterventionForSchedule(schedule);
    }

    this.logger.log('✅ PPM Engine: Generation complete.');
  }

  private async generateInterventionForSchedule(schedule: any) {
    // Duplicate prevention: Check if an intervention for this schedule and this date already exists
    const existing = await this.prisma.intervention.findFirst({
      where: {
        siteId: schedule.siteId,
        equipmentId: schedule.equipmentId,
        slaDeadline: new Date(schedule.nextDueDate),
        type: InterventionType.MAINTENANCE_PREVENTIVE,
      },
    });

    if (existing) {
      this.logger.log(
        `⚠️ Intervention already exists for ${schedule.title} at ${schedule.nextDueDate.toISOString()}`,
      );
      return;
    }

    this.logger.log(`📦 Generating intervention for: ${schedule.title}`);

    // Create the intervention
    const count = await this.prisma.intervention.count();
    const reference = `PPM-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    await this.prisma.intervention.create({
      data: {
        reference,
        title: `[PRÉVENTIF] ${schedule.title}`,
        description: `Maintenance préventive programmée. \nInstructions: ${schedule.description || 'N/A'}`,
        type: InterventionType.MAINTENANCE_PREVENTIVE,
        status: InterventionStatus.DEMANDE,
        priority: Priority.NORMALE,
        siteId: schedule.siteId,
        equipmentId: schedule.equipmentId,
        assignedTechnicians: schedule.assignedToId
          ? {
              connect: [{ id: schedule.assignedToId }],
            }
          : undefined,
        slaDeadline: new Date(schedule.nextDueDate), // Deadline is the scheduled date
        billable: schedule.billable, // Inherit billable status
      },
    });

    // Update schedule for the next cycle
    const nextDueDate = this.calculateNextDate(
      schedule.nextDueDate,
      schedule.frequency,
    );

    await this.prisma.maintenanceSchedule.update({
      where: { id: schedule.id },
      data: {
        lastRunDate: new Date(),
        nextDueDate: nextDueDate,
      },
    });
  }

  private calculateNextDate(current: Date, frequency: Frequency): Date {
    switch (frequency) {
      case Frequency.MONTHLY:
        return addMonths(current, 1);
      case Frequency.QUARTERLY:
        return addMonths(current, 3);
      case Frequency.SEMI_ANNUALLY:
        return addMonths(current, 6);
      case Frequency.ANNUALLY:
        return addYears(current, 1);
      default:
        return addMonths(current, 1);
    }
  }
}
