import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import {
  CreatePurchaseRequestDto,
  ValidatePurchaseRequestDto,
  RejectPurchaseRequestDto,
  CompletePurchaseDto,
} from './dto/purchases.dto';

@ApiTags('Purchases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.COMMERCIAL,
    Role.DIRECTEUR,
    Role.TECHNICIEN,
    Role.ACHETEUR,
  )
  @ApiOperation({ summary: "Créer une demande d'achat" })
  create(@Body() dto: CreatePurchaseRequestDto, @CurrentUser() user: any) {
    return this.purchasesService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "Lister les demandes d'achat" })
  findAll(@Query() query: any, @CurrentUser() user: any) {
    return this.purchasesService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une demande d'achat" })
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.purchasesService.findOne(id, user);
  }

  @Patch(':id/validate-commercial')
  @Roles(Role.COMMERCIAL, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Validation commerciale d'une demande" })
  validateCommercial(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.validateCommercial(id, dto, user);
  }

  @Patch(':id/validate-director')
  @Roles(Role.DIRECTEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Validation direction d'une demande" })
  validateDirector(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ValidatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.validateDirector(id, dto, user);
  }

  @Patch(':id/process')
  @Roles(Role.ACHETEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Mettre en cours d'achat" })
  processPurchase(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.processPurchase(id, user);
  }

  @Patch(':id/complete')
  @Roles(Role.ACHETEUR, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Finaliser l'achat" })
  completePurchase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CompletePurchaseDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.completePurchase(id, dto, user);
  }

  @Patch(':id/reject')
  @Roles(
    Role.COMMERCIAL,
    Role.DIRECTEUR,
    Role.ACHETEUR,
    Role.ADMIN,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: "Rejeter une demande d'achat" })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.reject(id, dto, user);
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.COMMERCIAL,
    Role.DIRECTEUR,
    Role.ACHETEUR,
  )
  @ApiOperation({ summary: "Modifier une demande d'achat" })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.purchasesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Supprimer une demande d'achat" })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.purchasesService.remove(id, user);
  }
}
