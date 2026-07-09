import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { InterventionType, Priority, InterventionStatus } from '@prisma/client';

export class CreateInterventionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(InterventionType)
  @IsNotEmpty()
  type: InterventionType;

  @IsEnum(Priority)
  @IsNotEmpty()
  priority: Priority;

  @IsNumber()
  @IsOptional()
  siteId?: number;

  @IsString()
  @IsOptional()
  manualLocation?: string;

  @IsNumber()
  @IsOptional()
  equipmentId?: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  assignedTechnicianIds?: number[];

  @IsNumber()
  @IsOptional()
  squadId?: number;

  @IsBoolean()
  @IsOptional()
  billable?: boolean;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;
}

export class UpdateInterventionStatusDto {
  @IsEnum(InterventionStatus)
  @IsNotEmpty()
  status: InterventionStatus;

  @IsString()
  @IsOptional()
  report?: string;

  @IsString()
  @IsOptional()
  signature?: string;

  @IsBoolean()
  @IsOptional()
  clientValidated?: boolean;
}
