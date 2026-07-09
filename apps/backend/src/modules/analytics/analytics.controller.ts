import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardKpis(@CurrentUser() user: any) {
    const companyId = user.role === Role.CLIENT ? user.companyId : undefined;
    return this.analyticsService.getDashboardKpis(companyId);
  }

  @Get('interventions-by-month')
  getInterventionsByMonth(@CurrentUser() user: any) {
    const companyId = user.role === Role.CLIENT ? user.companyId : undefined;
    return this.analyticsService.getInterventionsByMonth(companyId);
  }

  @Get('technician-performance')
  getTechnicianPerformance(@CurrentUser() user: any) {
    const companyId = user.role === Role.CLIENT ? user.companyId : undefined;
    return this.analyticsService.getTechnicianPerformance(companyId);
  }

  @Get('frequent-failures')
  getFrequentFailures(@CurrentUser() user: any) {
    const companyId = user.role === Role.CLIENT ? user.companyId : undefined;
    return this.analyticsService.getFrequentFailures(companyId);
  }

  @Get('site-stats')
  getSiteStats(@CurrentUser() user: any) {
    const companyId = user.role === Role.CLIENT ? user.companyId : undefined;
    return this.analyticsService.getSiteStats(companyId);
  }
}
