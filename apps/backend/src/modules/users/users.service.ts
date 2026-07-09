import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(dto: any) {
    const { password, email, companyId, tenantAccess, role: incomingRole, ...rest } = dto;
    const emailNormalized = email?.toLowerCase();
    const exists = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });
    if (exists) throw new ConflictException('Email déjà utilisé');

    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Handle Global Custom Role
    let finalRole: Role = Role.TECHNICIEN;
    let finalCustomRoleId: number | null = null;
    if (incomingRole && incomingRole.startsWith('CUSTOM_')) {
      finalCustomRoleId = parseInt(incomingRole.replace('CUSTOM_', ''));
    } else if (incomingRole) {
      finalRole = incomingRole as Role;
    }

    const createData: any = {
      ...rest,
      role: finalRole,
      customRoleId: finalCustomRoleId,
      email: emailNormalized,
      password: hashedPassword,
      companyId: companyId ? Number(companyId) : null,
    };

    if (tenantAccess && Array.isArray(tenantAccess)) {
      createData.tenantAccess = {
        create: tenantAccess.map((ta: any) => {
          let tRole: Role = Role.TECHNICIEN;
          let tCustomRoleId: number | null = null;
          if (ta.role && ta.role.startsWith('CUSTOM_')) {
            tCustomRoleId = parseInt(ta.role.replace('CUSTOM_', ''));
          } else if (ta.role) {
            tRole = ta.role as Role;
          }
          return {
            tenantId: ta.tenantId,
            role: tRole,
            customRoleId: tCustomRoleId
          };
        }),
      };
    }

    const user = await this.prisma.user.create({
      data: createData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tenantAccess: { select: { tenantId: true, role: true } },
      },
    });

    await this.auditService.create({
      action: 'CREATE',
      entity: 'USER',
      entityId: user.id,
      newValues: { name: user.name, email: user.email, role: user.role },
    });

    return user;
  }

  async findAll(query: {
    role?: Role;
    search?: string;
    includeInactive?: string;
  }) {
    const where: any = {};

    // Default to only active users unless explicitly requested
    if (query.includeInactive !== 'true') {
      where.isActive = true;
    }

    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
      ];
    }
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        companyId: true,
        company: { select: { id: true, name: true } },
        customRoleId: true,
        customRole: { select: { id: true, name: true } },
        tenantAccess: { select: { tenantId: true, role: true, customRoleId: true, tenant: { select: { name: true } } } },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        companyId: true,
        company: { select: { id: true, name: true } },
        tasksAssigned: {
          select: { id: true, title: true, status: true },
          take: 5,
        },
        customRoleId: true,
        customRole: { select: { id: true, name: true } },
        tenantAccess: { select: { tenantId: true, role: true, customRoleId: true } },
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async update(id: number, dto: any) {
    const { companyId, password, email, tenantAccess, role: incomingRole, ...rest } = dto;
    const data: any = { ...rest };

    if (incomingRole) {
      if (incomingRole.startsWith('CUSTOM_')) {
        data.customRoleId = parseInt(incomingRole.replace('CUSTOM_', ''));
        data.role = Role.TECHNICIEN; // Fallback required role
      } else {
        data.role = incomingRole as Role;
        data.customRoleId = null;
      }
    }

    if (password) {
      data.password = await bcrypt.hash(password, 12);
    }

    if (email) {
      data.email = email.toLowerCase();
    }

    if (companyId !== undefined) {
      data.companyId = companyId ? Number(companyId) : null;
    }

    if (tenantAccess && Array.isArray(tenantAccess)) {
      // Manage tenantAccess (many-to-many with payload)
      data.tenantAccess = {
        deleteMany: {},
        create: tenantAccess.map((ta: any) => {
          let tRole: Role = Role.TECHNICIEN;
          let tCustomRoleId: number | null = null;
          if (ta.role && ta.role.startsWith('CUSTOM_')) {
            tCustomRoleId = parseInt(ta.role.replace('CUSTOM_', ''));
          } else if (ta.role) {
            tRole = ta.role as Role;
          }
          return {
            tenantId: ta.tenantId,
            role: tRole,
            customRoleId: tCustomRoleId
          };
        }),
      };
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        tenantAccess: { select: { tenantId: true, role: true } },
      },
    });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'USER',
      entityId: id,
      newValues: rest,
    });

    return updated;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await this.auditService.create({
      action: 'DELETE',
      entity: 'USER',
      entityId: id,
    });

    return { message: 'Utilisateur désactivé avec succès' };
  }

  async getStats() {
    const [total, byRole] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
        where: { isActive: true },
      }),
    ]);
    return { total, byRole };
  }

  private readonly permissionsFilePath = path.join(
    process.cwd(),
    'role-permissions.json',
  );

  async getPermissions() {
    try {
      if (fs.existsSync(this.permissionsFilePath)) {
        const content = fs.readFileSync(this.permissionsFilePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error(
        'Failed to read permissions file, using static fallback:',
        err,
      );
    }
    return this.getDefaultPermissions();
  }

  async savePermissions(permissions: any) {
    try {
      fs.writeFileSync(
        this.permissionsFilePath,
        JSON.stringify(permissions, null, 2),
        'utf8',
      );

      await this.auditService.create({
        action: 'UPDATE',
        entity: 'PERMISSIONS_MATRIX',
        entityId: 0,
        newValues: { message: 'Permissions matrix updated' },
      });

      return { success: true };
    } catch (err) {
      console.error('Failed to save permissions file:', err);
      throw new Error("Impossible d'enregistrer la matrice de permissions");
    }
  }

  // --- CUSTOM ROLES CRUD ---

  async getCustomRoles(tenantId?: number) {
    return this.prisma.customRole.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { _count: { select: { users: true, tenantMembers: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCustomRole(data: any) {
    const { name, permissions, tenantId } = data;
    
    // Validate uniqueness
    const existing = await this.prisma.customRole.findFirst({
      where: { name, tenantId: tenantId || null }
    });
    if (existing) {
      throw new ConflictException(`Le rôle '${name}' existe déjà${tenantId ? " dans cet espace" : ""}.`);
    }

    const role = await this.prisma.customRole.create({
      data: {
        name,
        permissions: permissions || [],
        tenantId: tenantId || null,
      }
    });

    await this.auditService.create({
      action: 'CREATE',
      entity: 'CUSTOM_ROLE',
      entityId: role.id,
      newValues: { name: role.name },
    });

    return role;
  }

  async updateCustomRole(id: number, data: any) {
    const { name, permissions } = data;
    const role = await this.prisma.customRole.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions }),
      }
    });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'CUSTOM_ROLE',
      entityId: role.id,
      newValues: { name: role.name },
    });

    return role;
  }

  async deleteCustomRole(id: number) {
    const role = await this.prisma.customRole.findUnique({ where: { id }, include: { _count: { select: { users: true, tenantMembers: true } } } });
    if (!role) throw new BadRequestException('Role introuvable');
    if (role._count.users > 0 || role._count.tenantMembers > 0) {
      throw new BadRequestException('Ce rôle est assigné à des utilisateurs et ne peut pas être supprimé');
    }

    await this.prisma.customRole.delete({ where: { id } });

    await this.auditService.create({
      action: 'DELETE',
      entity: 'CUSTOM_ROLE',
      entityId: id,
    });

    return { message: 'Rôle supprimé avec succès' };
  }

  async revokeSession(id: number) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: null },
    });

    this.eventEmitter.emit('user.session.revoked', { userId: id });

    await this.auditService.create({
      action: 'UPDATE',
      entity: 'USER_SESSION',
      entityId: id,
      newValues: { message: 'User session revoked by administrator' },
    });

    return { success: true };
  }

  private getDefaultPermissions() {
    return {
      SUPER_ADMIN: [
        'analytics:view',
        'analytics:full',
        'task:read',
        'task:create',
        'task:edit',
        'task:delete',
        'intervention:read',
        'intervention:create',
        'intervention:edit',
        'intervention:delete',
        'project:read',
        'project:manage',
        'site:read',
        'site:manage',
        'equipment:read',
        'equipment:manage',
        'contract:read',
        'contract:manage',
        'invoice:read',
        'invoice:manage',
        'document:read',
        'document:manage',
        'user:manage',
        'settings:manage',
      ],
      ADMIN: [
        'analytics:view',
        'analytics:full',
        'task:read',
        'task:create',
        'task:edit',
        'task:delete',
        'intervention:read',
        'intervention:create',
        'intervention:edit',
        'intervention:delete',
        'project:read',
        'project:manage',
        'site:read',
        'site:manage',
        'equipment:read',
        'equipment:manage',
        'contract:read',
        'contract:manage',
        'invoice:read',
        'invoice:manage',
        'document:read',
        'document:manage',
        'user:manage',
      ],
      DIRECTEUR: [
        'analytics:view',
        'analytics:full',
        'task:read',
        'task:create',
        'task:edit',
        'task:delete',
        'intervention:read',
        'intervention:create',
        'intervention:edit',
        'intervention:delete',
        'project:read',
        'project:manage',
        'site:read',
        'site:manage',
        'equipment:read',
        'equipment:manage',
        'contract:read',
        'contract:manage',
        'invoice:read',
        'invoice:manage',
        'document:read',
        'document:manage',
        'user:manage',
      ],
      CHEF_PROJET: [
        'analytics:view',
        'task:read',
        'task:create',
        'task:edit',
        'intervention:read',
        'intervention:create',
        'intervention:edit',
        'project:read',
        'project:manage',
        'site:read',
        'equipment:read',
        'document:read',
        'document:manage',
        'invoice:read',
      ],
      RESPONSABLE_TECHNIQUE: [
        'analytics:view',
        'task:read',
        'task:create',
        'task:edit',
        'task:delete',
        'intervention:read',
        'intervention:create',
        'intervention:edit',
        'site:read',
        'site:manage',
        'equipment:read',
        'equipment:manage',
        'document:read',
        'document:manage',
        'project:read',
      ],
      TECHNICIEN: [
        'task:read',
        'intervention:read',
        'intervention:create',
        'equipment:read',
        'site:read',
        'document:read',
      ],
      CLIENT: [
        'intervention:read',
        'intervention:create',
        'equipment:read',
        'project:read',
        'document:read',
      ],
      COMMERCIAL: [
        'analytics:view',
        'task:read',
        'intervention:read',
        'project:read',
        'site:read',
        'equipment:read',
        'contract:read',
        'invoice:read',
        'document:read',
      ],
      ACHETEUR: [
        'analytics:view',
        'task:read',
        'intervention:read',
        'project:read',
        'site:read',
        'equipment:read',
        'document:read',
      ],
    };
  }
}
