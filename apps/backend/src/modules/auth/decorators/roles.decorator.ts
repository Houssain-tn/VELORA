import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify required roles for a route.
 * @example @Roles(Role.ADMIN, Role.DIRECTEUR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
