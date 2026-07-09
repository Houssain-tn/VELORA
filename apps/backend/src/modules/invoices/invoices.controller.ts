import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTEUR)
  create(@Body() dto: any) {
    return this.invoicesService.create(dto);
  }

  @Get()
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DIRECTEUR,
    Role.CHEF_PROJET,
    Role.CLIENT,
  )
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.invoicesService.findAll(query, user);
  }

  @Get(':id')
  @Roles(
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.DIRECTEUR,
    Role.CHEF_PROJET,
    Role.CLIENT,
  )
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.invoicesService.findOne(+id, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.DIRECTEUR)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.invoicesService.update(+id, dto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(+id);
  }
}
