import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  InternalServerErrorException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TaskStatus, Role } from '@prisma/client';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles(Role.CHEF_PROJET, Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une tâche' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.tasksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les tâches' })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.tasksService.findAll(query, user);
  }

  @Get('kanban')
  @ApiOperation({ summary: 'Tâches pour vue Kanban' })
  getKanban(@Query() query: any, @CurrentUser() user: any) {
    return this.tasksService.getKanban(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une tâche" })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tasksService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.CHEF_PROJET, Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une tâche' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: any,
    @CurrentUser() user: any,
  ) {
    return this.tasksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(
    Role.RESPONSABLE_TECHNIQUE,
    Role.DIRECTEUR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Supprimer une tâche' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.tasksService.remove(id, user);
  }

  @Post('reorder')
  @Roles(Role.CHEF_PROJET, Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Réorganiser les tâches (drag & drop)' })
  reorder(
    @Body()
    body: {
      tasks: { id: number; order: number; status: TaskStatus }[];
    },
  ) {
    return this.tasksService.reorder(body.tasks);
  }

  @Post('sync-progress')
  @Roles(Role.CHEF_PROJET, Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Synchroniser toute la progression du parc' })
  syncAll() {
    return this.tasksService.syncAllProgress();
  }
}
