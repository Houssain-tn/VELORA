import { useAuthStore } from '@/stores/useAuthStore';
import { useRolePermissions } from '@/hooks/useApi';

// Permissions definition
export const Permission = {
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_FULL: 'analytics:full',
  TASK_READ: 'task:read',
  TASK_CREATE: 'task:create',
  TASK_EDIT: 'task:edit',
  TASK_DELETE: 'task:delete',
  INTERVENTION_READ: 'intervention:read',
  INTERVENTION_CREATE: 'intervention:create',
  INTERVENTION_EDIT: 'intervention:edit',
  INTERVENTION_DELETE: 'intervention:delete',
  PROJECT_READ: 'project:read',
  PROJECT_MANAGE: 'project:manage',
  SITE_READ: 'site:read',
  SITE_MANAGE: 'site:manage',
  EQUIPMENT_READ: 'equipment:read',
  EQUIPMENT_MANAGE: 'equipment:manage',
  CONTRACT_READ: 'contract:read',
  CONTRACT_MANAGE: 'contract:manage',
  INVOICE_READ: 'invoice:read',
  INVOICE_MANAGE: 'invoice:manage',
  DOCUMENT_READ: 'document:read',
  DOCUMENT_MANAGE: 'document:manage',
  USER_MANAGE: 'user:manage',
  SETTINGS_MANAGE: 'settings:manage'
} as const;

export type Permission = typeof Permission[keyof typeof Permission];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: Object.values(Permission),
  ADMIN: Object.values(Permission).filter(p => p !== Permission.SETTINGS_MANAGE),
  DIRECTEUR: Object.values(Permission).filter(p => p !== Permission.SETTINGS_MANAGE),
  CHEF_PROJET: [
    Permission.ANALYTICS_VIEW, Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_EDIT,
    Permission.INTERVENTION_READ, Permission.INTERVENTION_CREATE, Permission.INTERVENTION_EDIT,
    Permission.PROJECT_READ, Permission.PROJECT_MANAGE, Permission.SITE_READ, Permission.EQUIPMENT_READ,
    Permission.DOCUMENT_READ, Permission.DOCUMENT_MANAGE, Permission.INVOICE_READ
  ],
  RESPONSABLE_TECHNIQUE: [
    Permission.ANALYTICS_VIEW,    Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_EDIT, Permission.TASK_DELETE,
    Permission.INTERVENTION_READ, Permission.INTERVENTION_CREATE, Permission.INTERVENTION_EDIT,
    Permission.SITE_READ, Permission.SITE_MANAGE, Permission.EQUIPMENT_READ, Permission.EQUIPMENT_MANAGE,
    Permission.DOCUMENT_READ, Permission.DOCUMENT_MANAGE, Permission.PROJECT_READ
  ],
  TECHNICIEN: [
    Permission.TASK_READ, Permission.INTERVENTION_READ, Permission.INTERVENTION_CREATE,
    Permission.EQUIPMENT_READ, Permission.SITE_READ, Permission.DOCUMENT_READ
  ],
  CLIENT: [
    Permission.INTERVENTION_READ, Permission.INTERVENTION_CREATE, Permission.EQUIPMENT_READ,
    Permission.PROJECT_READ, Permission.DOCUMENT_READ
  ],
  COMMERCIAL: [
    Permission.ANALYTICS_VIEW, Permission.TASK_READ, Permission.INTERVENTION_READ,
    Permission.PROJECT_READ, Permission.SITE_READ, Permission.EQUIPMENT_READ,
    Permission.CONTRACT_READ, Permission.INVOICE_READ, Permission.DOCUMENT_READ
  ],
  ACHETEUR: [
    Permission.ANALYTICS_VIEW, Permission.TASK_READ, Permission.INTERVENTION_READ,
    Permission.PROJECT_READ, Permission.SITE_READ, Permission.EQUIPMENT_READ,
    Permission.DOCUMENT_READ
  ]
};

export function usePermissions() {
  const { user, simulatedRole } = useAuthStore();
  const userRole = simulatedRole || user?.role || 'CLIENT';
  const { data: rolePermissions } = useRolePermissions();
  const permissions = (rolePermissions || ROLE_PERMISSIONS)[userRole] || [];

  const can = (permission: Permission) => permissions.includes(permission);

  return {
    can,
    isAdmin: userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'DIRECTEUR',
    isSuperAdmin: userRole === 'SUPER_ADMIN',
    
    // Core Module access flags
    canSeeAnalytics: can(Permission.ANALYTICS_VIEW),
    canSeeTasks: can(Permission.TASK_READ),
    canSeeInterventions: can(Permission.INTERVENTION_READ),
    canSeeProjects: can(Permission.PROJECT_READ),
    canSeeSites: can(Permission.SITE_READ),
    canSeeEquipment: can(Permission.EQUIPMENT_READ),
    canSeeContracts: can(Permission.CONTRACT_READ),
    canSeeInvoices: can(Permission.INVOICE_READ),
    canSeeDocuments: can(Permission.DOCUMENT_READ),
    canManageUsers: can(Permission.USER_MANAGE),
    canManageSettings: can(Permission.SETTINGS_MANAGE),
    
    // Detailed Action flags (backward compatibility & explicit checks)
    canCreateTask: can(Permission.TASK_CREATE),
    canEditTask: can(Permission.TASK_EDIT),
    canDeleteTask: can(Permission.TASK_DELETE),
    
    canCreateIntervention: can(Permission.INTERVENTION_CREATE),
    canEditIntervention: can(Permission.INTERVENTION_EDIT),
    canDeleteIntervention: can(Permission.INTERVENTION_DELETE),
    
    canCreateProject: can(Permission.PROJECT_MANAGE),
    canDeleteProject: can(Permission.PROJECT_MANAGE),
    
    canCreateSite: can(Permission.SITE_MANAGE),
    canCreateEquipment: can(Permission.EQUIPMENT_MANAGE),
    canCreateContract: can(Permission.CONTRACT_MANAGE),
    canCreateInvoice: can(Permission.INVOICE_MANAGE),
    canDeleteDocument: can(Permission.DOCUMENT_MANAGE) && (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'DIRECTEUR'),
    
    canSeeAdminMenu: can(Permission.USER_MANAGE) || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'DIRECTEUR',
  };
}
