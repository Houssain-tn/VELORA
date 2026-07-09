import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MoyensGenerauxService } from './moyens-generaux.service';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@ApiTags('Moyens Generaux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('moyens-generaux')
export class MoyensGenerauxController {
  constructor(private readonly service: MoyensGenerauxService) {}

  // SERVICE REQUESTS
  @Post('requests')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.TECHNICIEN)
  createRequest(@Body() dto: Prisma.ServiceRequestCreateInput) {
    return this.service.createServiceRequest(dto);
  }

  @Get('requests')
  findAllRequests(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.service.findAllServiceRequests({
      status,
      category,
      siteId: siteId ? +siteId : undefined,
    });
  }

  @Get('requests/:id')
  findOneRequest(@Param('id') id: string) {
    return this.service.findOneServiceRequest(+id);
  }

  @Patch('requests/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  updateRequest(
    @Param('id') id: string,
    @Body() dto: Prisma.ServiceRequestUpdateInput,
  ) {
    return this.service.updateServiceRequest(+id, dto);
  }

  @Delete('requests/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeRequest(@Param('id') id: string) {
    return this.service.removeServiceRequest(+id);
  }

  // SUPPLIERS
  @Post('suppliers')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  createSupplier(@Body() dto: Prisma.SupplierCreateInput) {
    return this.service.createSupplier(dto);
  }

  @Get('suppliers')
  findAllSuppliers(@Query('contractStatus') contractStatus?: string) {
    return this.service.findAllSuppliers(contractStatus);
  }

  @Get('suppliers/:id')
  findOneSupplier(@Param('id') id: string) {
    return this.service.findOneSupplier(+id);
  }

  @Patch('suppliers/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  updateSupplier(
    @Param('id') id: string,
    @Body() dto: Prisma.SupplierUpdateInput,
  ) {
    return this.service.updateSupplier(+id, dto);
  }

  @Delete('suppliers/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeSupplier(@Param('id') id: string) {
    return this.service.removeSupplier(+id);
  }

  // OFFICE SUPPLIES
  @Post('supplies')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  createSupply(@Body() dto: Prisma.OfficeSupplyCreateInput) {
    return this.service.createOfficeSupply(dto);
  }

  @Get('supplies')
  findAllSupplies(@Query('lowStockOnly') lowStockOnly?: string) {
    return this.service.findAllOfficeSupplies(lowStockOnly === 'true');
  }

  @Patch('supplies/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  updateSupply(
    @Param('id') id: string,
    @Body() dto: Prisma.OfficeSupplyUpdateInput,
  ) {
    return this.service.updateOfficeSupply(+id, dto);
  }

  @Delete('supplies/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeSupply(@Param('id') id: string) {
    return this.service.removeOfficeSupply(+id);
  }

  // COMPANY SPACES
  @Post('spaces')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  createSpace(@Body() dto: Prisma.CompanySpaceCreateInput) {
    return this.service.createSpace(dto);
  }

  @Get('spaces')
  findAllSpaces(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllSpaces(type, status);
  }

  @Patch('spaces/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DIRECTEUR)
  updateSpace(
    @Param('id') id: string,
    @Body() dto: Prisma.CompanySpaceUpdateInput,
  ) {
    return this.service.updateSpace(+id, dto);
  }

  @Delete('spaces/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  removeSpace(@Param('id') id: string) {
    return this.service.removeSpace(+id);
  }

  // STATS
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
