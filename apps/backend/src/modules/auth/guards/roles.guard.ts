import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { Permission, ROLE_PERMISSIONS } from '../constants/permissions';

import * as fs from 'fs';
import * as path from 'path';

// Cache for dynamic system permissions
let dynamicPermissionsCache: any = null;
let lastCacheTime = 0;

function getDynamicPermissions() {
  const now = Date.now();
  if (dynamicPermissionsCache && now - lastCacheTime < 60000) {
    return dynamicPermissionsCache;
  }
  
  try {
    const filePath = path.join(process.cwd(), 'role-permissions.json');
    if (fs.existsSync(filePath)) {
      dynamicPermissionsCache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      lastCacheTime = now;
      return dynamicPermissionsCache;
    }
  } catch (err) {}
  
  // Fallback to static
  return ROLE_PERMISSIONS;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const { user, tenantId } = request;
    if (!user) {
      throw new ForbiddenException('Authentification requise');
    }

    // Determine effective role and custom permissions
    let effectiveRole: Role = user.role; // Default global role
    let customPermissions: string[] | null = user.customRole?.permissions || null;

    if (tenantId) {
      const access = user.tenantAccess?.find((t: any) => t.tenantId === tenantId);
      if (access) {
        effectiveRole = access.role;
        if (access.customRole) {
          customPermissions = access.customRole.permissions;
        }
      } else if (user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(`Accès refusé pour l'espace ${tenantId}`);
      }
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => effectiveRole === role);
      if (!hasRole) return false; 
    }

    // 2. Check Permissions (PRO/Granular)
    if (requiredPermissions && requiredPermissions.length > 0) {
      const systemPermissions = getDynamicPermissions()[effectiveRole as string] || [];
      const userPermissions = customPermissions || systemPermissions;
      
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm),
      );
      
      // Use debug level — only visible when LOG_LEVEL=debug, not in normal production logs
      this.logger.debug(
        `User: ${user.id}, Role: ${effectiveRole}, ` +
        `ReqPerms: [${requiredPermissions.join(', ')}], HasPerms: ${hasPermission}`,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Accès refusé: permissions requises [${requiredPermissions.join(', ')}]`,
        );
      }
    }

    return true;
  }
}
