import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '@fems/shared';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';

export type ExtinguisherSortField =
  | 'expiryDate'
  | 'serialNumber'
  | 'installationDate'
  | 'createdAt';

export type ExtinguisherSortOrder = 'ASC' | 'DESC';

export class ListExtinguishersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'When true, only unassigned warehouse stock' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'When true, only extinguishers assigned to a customer',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  assignedOnly?: boolean;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  expiryFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiryTo?: string;

  @ApiPropertyOptional({ description: 'Search by serial number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['expiryDate', 'serialNumber', 'installationDate', 'createdAt'],
    default: 'expiryDate',
  })
  @IsOptional()
  @IsIn(['expiryDate', 'serialNumber', 'installationDate', 'createdAt'])
  sortBy?: ExtinguisherSortField;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: ExtinguisherSortOrder;
}

export class ListMineExtinguishersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  expiryFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiryTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ['expiryDate', 'serialNumber', 'installationDate', 'createdAt'],
  })
  @IsOptional()
  @IsIn(['expiryDate', 'serialNumber', 'installationDate', 'createdAt'])
  sortBy?: ExtinguisherSortField;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: ExtinguisherSortOrder;
}

export interface ExtinguisherFilterOptions {
  status?: ExtinguisherStatus;
  customerId?: string;
  inStock?: boolean;
  assignedOnly?: boolean;
  expiryFrom?: string;
  expiryTo?: string;
  search?: string;
  sortBy?: ExtinguisherSortField;
  sortOrder?: ExtinguisherSortOrder;
}
