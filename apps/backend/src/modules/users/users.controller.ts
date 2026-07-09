import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel utilisateur' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  async create(@Body() dto: any) {
    try {
      return await this.usersService.create(dto);
    } catch (e: any) {
      console.error('CREATE USER ERROR:', e);
      throw new BadRequestException(e.message || 'Error creating user');
    }
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF_PROJET, Role.RESPONSABLE_TECHNIQUE)
  @ApiOperation({ summary: 'Liste tous les utilisateurs' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: String })
  findAll(
    @Query() query: { role?: Role; search?: string; includeInactive?: string },
  ) {
    return this.usersService.findAll(query);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Statistiques des utilisateurs' })
  getStats() {
    return this.usersService.getStats();
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Obtenir la matrice des permissions par rôle' })
  getPermissions() {
    return this.usersService.getPermissions();
  }

  @Post('permissions')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Enregistrer la matrice des permissions par rôle' })
  savePermissions(@Body() body: any) {
    return this.usersService.savePermissions(body);
  }

  @Get('custom-roles')
  @ApiOperation({ summary: 'Obtenir la liste des rôles personnalisés' })
  getCustomRoles(@Query('tenantId') tenantId?: string) {
    return this.usersService.getCustomRoles(tenantId ? parseInt(tenantId) : undefined);
  }

  @Post('custom-roles')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer un rôle personnalisé' })
  createCustomRole(@Body() body: any) {
    return this.usersService.createCustomRole(body);
  }

  @Patch('custom-roles/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Modifier un rôle personnalisé' })
  updateCustomRole(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.usersService.updateCustomRole(id, body);
  }

  @Delete('custom-roles/:id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Supprimer un rôle personnalisé' })
  deleteCustomRole(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deleteCustomRole(id);
  }

  @Post(':id/revoke-session')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  @ApiOperation({ summary: "Forcer la déconnexion d'un utilisateur" })
  revokeSession(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.revokeSession(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF_PROJET, Role.RESPONSABLE_TECHNIQUE)
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un utilisateur' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @Request() req: any,
  ) {
    const userRole = req.user.role;
    const userId = req.user.sub; // Passport JWT strategy usually puts id in 'sub' or 'userId'

    // Security: Only admins can update other users. Normal users can only update themselves.
    if (
      userRole !== Role.ADMIN &&
      userRole !== Role.SUPER_ADMIN &&
      userRole !== Role.DIRECTEUR &&
      userId !== id
    ) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier ce profil.",
      );
    }

    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  @ApiOperation({ summary: 'Désactiver un utilisateur (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
