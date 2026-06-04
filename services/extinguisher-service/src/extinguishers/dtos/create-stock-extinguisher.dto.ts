import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  FIELD_MESSAGES,
  FIELD_PATTERNS,
  ValidateExtinguisherDates,
} from '@fems/shared';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ExtinguisherSize } from '../entities/extinguisher-size.enum';
import { ExtinguisherType } from '../entities/extinguisher-type.enum';

export class CreateStockExtinguisherDto {
  @ApiProperty({ example: 'FE-STOCK-001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(100)
  @Matches(FIELD_PATTERNS.SERIAL_NUMBER, {
    message: FIELD_MESSAGES.SERIAL_NUMBER,
  })
  serialNumber: string;

  @ApiPropertyOptional({ example: 'Central warehouse' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  @Matches(FIELD_PATTERNS.LOCATION, {
    message: FIELD_MESSAGES.LOCATION,
  })
  location?: string;

  @ApiProperty({ enum: ExtinguisherType })
  @IsEnum(ExtinguisherType)
  type: ExtinguisherType;

  @ApiProperty({ enum: ExtinguisherSize })
  @IsEnum(ExtinguisherSize)
  size: ExtinguisherSize;

  @ApiProperty({ example: '2024-01-15' })
  @IsDateString()
  @ValidateExtinguisherDates()
  installationDate: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  @ValidateExtinguisherDates()
  expiryDate: string;
}
