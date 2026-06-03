import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FIELD_MESSAGES,
  FIELD_PATTERNS,
  ValidateExtinguisherDates,
} from '@fems/shared';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExtinguisherSize } from '../entities/extinguisher-size.enum';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { ExtinguisherType } from '../entities/extinguisher-type.enum';

export class CreateExtinguisherDto {
  @ApiProperty({ example: 'FE-2024-001234' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.SERIAL_NUMBER, {
    message: FIELD_MESSAGES.SERIAL_NUMBER,
  })
  serialNumber: string;

  @ApiProperty({ example: 'Building A — Floor 2 — East corridor' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.LOCATION, {
    message: FIELD_MESSAGES.LOCATION,
  })
  location: string;

  @ApiProperty({ enum: ExtinguisherType })
  @IsEnum(ExtinguisherType)
  type: ExtinguisherType;

  @ApiProperty({ enum: ExtinguisherSize })
  @IsEnum(ExtinguisherSize)
  size: ExtinguisherSize;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  installationDate: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @ValidateExtinguisherDates()
  expiryDate: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  customerId: string;
}

export class UpdateExtinguisherDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.SERIAL_NUMBER, {
    message: FIELD_MESSAGES.SERIAL_NUMBER,
  })
  serialNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.LOCATION, {
    message: FIELD_MESSAGES.LOCATION,
  })
  location?: string;

  @ApiPropertyOptional({ enum: ExtinguisherType })
  @IsOptional()
  @IsEnum(ExtinguisherType)
  type?: ExtinguisherType;

  @ApiPropertyOptional({ enum: ExtinguisherSize })
  @IsOptional()
  @IsEnum(ExtinguisherSize)
  size?: ExtinguisherSize;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ enum: ExtinguisherStatus })
  @IsOptional()
  @IsEnum(ExtinguisherStatus)
  status?: ExtinguisherStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  customerId?: string;
}

export class RenewExtinguisherDto {
  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  expiryDate: string;
}
