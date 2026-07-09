import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Priority, PurchaseRequestStatus } from '@prisma/client';

export class CreatePurchaseRequestDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  justification?: string;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @IsNumber()
  @IsOptional()
  projectId?: number;

  @IsNumber()
  @IsOptional()
  siteId?: number;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  attachmentName?: string;
}

export class ValidatePurchaseRequestDto {
  @IsString()
  @IsOptional()
  comment?: string;
}

export class RejectPurchaseRequestDto {
  @IsString()
  @IsNotEmpty()
  comment: string; // Rejecting requires a comment/justification
}

export class CompletePurchaseDto {
  @IsNumber()
  @IsNotEmpty()
  actualCost: number;

  @IsBoolean()
  @IsOptional()
  convertToAsset?: boolean;

  @IsString()
  @IsOptional()
  assetType?: 'FIXED_ASSET' | 'VEHICLE' | 'OFFICE_SUPPLY';

  @IsOptional()
  assetData?: any;
}
