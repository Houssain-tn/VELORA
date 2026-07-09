// --- ARCHIVE ENGINE ACTIVATED ---
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SitesModule } from './modules/sites/sites.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { EquipmentModule } from './modules/equipment/equipment.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PhasesModule } from './modules/phases/phases.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { CommentsModule } from './modules/comments/comments.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { MaintenanceSchedulesModule } from './modules/maintenance-schedules/maintenance-schedules.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { VeloraGateway } from './websocket/velora.gateway';
import { WebsocketListener } from './websocket/websocket.listener';
import { AuditModule } from './modules/audit/audit.module';
import { BackupModule } from './modules/backup/backup.module';
import { SquadsModule } from './modules/squads/squads.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CopilotModule } from './modules/copilot/copilot.module';
import { ImmobilisationsModule } from './modules/immobilisations/immobilisations.module';
import { ParcAutoModule } from './modules/parc-auto/parc-auto.module';
import { MoyensGenerauxModule } from './modules/moyens-generaux/moyens-generaux.module';
import { APP_GUARD } from '@nestjs/core';
import { TenantMiddleware } from './common/middlewares/tenant.middleware';
import { TenantsModule } from './tenants/tenants.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TasksModule,
    InterventionsModule,
    NotificationsModule,
    AnalyticsModule,
    SitesModule,
    ContractsModule,
    CopilotModule,
    EquipmentModule,
    ProjectsModule,
    PhasesModule,
    DocumentsModule,
    CommentsModule,
    CompaniesModule,
    MaintenanceSchedulesModule,
    InvoicesModule,
    ScheduleModule.forRoot(),
    AuditModule,
    BackupModule,
    SquadsModule,
    MeetingsModule,
    PurchasesModule,
    ImmobilisationsModule,
    ParcAutoModule,
    MoyensGenerauxModule,
    TenantsModule,
    SearchModule,
  ],
  providers: [
    VeloraGateway,
    WebsocketListener,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
