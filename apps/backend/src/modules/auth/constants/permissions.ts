import { Role } from '@prisma/client';

export enum Permission {
  // Dashboard & Analytics
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_FULL = 'analytics:full',

  // Tasks (Kanban)
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_EDIT = 'task:edit',
  TASK_DELETE = 'task:delete',

  // Interventions
  INTERVENTION_READ = 'intervention:read',
  INTERVENTION_CREATE = 'intervention:create',
  INTERVENTION_EDIT = 'intervention:edit',
  INTERVENTION_DELETE = 'intervention:delete',

  // Projects & Phases
  PROJECT_READ = 'project:read',
  PROJECT_MANAGE = 'project:manage',

  // Sites & Equipment
  SITE_READ = 'site:read',
  SITE_MANAGE = 'site:manage',
  EQUIPMENT_READ = 'equipment:read',
  EQUIPMENT_MANAGE = 'equipment:manage',

  // Contracts & Billing
  CONTRACT_READ = 'contract:read',
  CONTRACT_MANAGE = 'contract:manage',
  INVOICE_READ = 'invoice:read',
  INVOICE_MANAGE = 'invoice:manage',

  // Documents
  DOCUMENT_READ = 'document:read',
  DOCUMENT_MANAGE = 'document:manage',

  // System & Users
  USER_MANAGE = 'user:manage',
  SETTINGS_MANAGE = 'settings:manage',

  // Squads
  SQUAD_READ = 'squad:read',
  SQUAD_MANAGE = 'squad:manage',

  // Meetings
  MEETING_READ = 'meeting:read',
  MEETING_CREATE = 'meeting:create',
  MEETING_MANAGE = 'meeting:manage',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: Object.values(Permission).filter(
    (p) =>
      p !== Permission.SETTINGS_MANAGE &&
      p !== Permission.MEETING_CREATE &&
      p !== Permission.MEETING_MANAGE,
  ),
  DIRECTEUR: Object.values(Permission).filter(
    (p) =>
      p !== Permission.SETTINGS_MANAGE &&
      p !== Permission.MEETING_CREATE &&
      p !== Permission.MEETING_MANAGE,
  ),
  CHEF_PROJET: [
    Permission.ANALYTICS_VIEW,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.INTERVENTION_READ,
    Permission.INTERVENTION_CREATE,
    Permission.INTERVENTION_EDIT,
    Permission.PROJECT_READ,
    Permission.PROJECT_MANAGE,
    Permission.SITE_READ,
    Permission.EQUIPMENT_READ,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_MANAGE,
    Permission.INVOICE_READ,
    Permission.SQUAD_READ,
    Permission.SQUAD_MANAGE,
    Permission.MEETING_READ,
  ],
  RESPONSABLE_TECHNIQUE: [
    Permission.ANALYTICS_VIEW,
    Permission.TASK_READ,
    Permission.TASK_CREATE,
    Permission.TASK_EDIT,
    Permission.INTERVENTION_READ,
    Permission.INTERVENTION_CREATE,
    Permission.INTERVENTION_EDIT,
    Permission.SITE_READ,
    Permission.SITE_MANAGE,
    Permission.EQUIPMENT_READ,
    Permission.EQUIPMENT_MANAGE,
    Permission.DOCUMENT_READ,
    Permission.DOCUMENT_MANAGE,
    Permission.PROJECT_READ,
    Permission.SQUAD_READ,
    Permission.SQUAD_MANAGE,
    Permission.MEETING_READ,
  ],
  TECHNICIEN: [
    Permission.TASK_READ,
    Permission.TASK_EDIT,
    Permission.INTERVENTION_READ,
    Permission.INTERVENTION_CREATE,
    Permission.EQUIPMENT_READ,
    Permission.SITE_READ,
    Permission.DOCUMENT_READ,
    Permission.MEETING_READ,
  ],
  CLIENT: [
    Permission.INTERVENTION_READ,
    Permission.INTERVENTION_CREATE,
    Permission.EQUIPMENT_READ,
    Permission.PROJECT_READ,
    Permission.DOCUMENT_READ,
    Permission.MEETING_READ,
  ],
  COMMERCIAL: [
    Permission.ANALYTICS_VIEW,
    Permission.TASK_READ,
    Permission.INTERVENTION_READ,
    Permission.PROJECT_READ,
    Permission.SITE_READ,
    Permission.EQUIPMENT_READ,
    Permission.DOCUMENT_READ,
    Permission.CONTRACT_READ,
    Permission.INVOICE_READ,
    Permission.MEETING_READ,
  ],
  ACHETEUR: [
    Permission.ANALYTICS_VIEW,
    Permission.TASK_READ,
    Permission.INTERVENTION_READ,
    Permission.PROJECT_READ,
    Permission.SITE_READ,
    Permission.EQUIPMENT_READ,
    Permission.DOCUMENT_READ,
    Permission.MEETING_READ,
  ],
};
