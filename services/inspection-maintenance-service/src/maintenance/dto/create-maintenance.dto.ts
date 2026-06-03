import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const MAINTENANCE_LOG_TEXT_PATTERN =
  /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ])[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,;:!?'()\-/\n\r]{3,5000}$/;

function trimOptional(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export class CreateMaintenanceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  extinguisherId: string;

  @ApiProperty({ example: 'Recharged and pressure-tested' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  actionTaken: string;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  maintenanceDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'issuesIdentified must be a string' })
  @Matches(MAINTENANCE_LOG_TEXT_PATTERN, {
    message:
      'issuesIdentified must be text with letters (3+ characters; letters, numbers, and common punctuation only)',
  })
  issuesIdentified?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'notes must be a string' })
  @Matches(MAINTENANCE_LOG_TEXT_PATTERN, {
    message:
      'notes must be text with letters (3+ characters; letters, numbers, and common punctuation only)',
  })
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => trimOptional(value))
  @ValidateIf((_, v) => v !== undefined)
  @IsString({ message: 'recommendations must be a string' })
  @Matches(MAINTENANCE_LOG_TEXT_PATTERN, {
    message:
      'recommendations must be text with letters (3+ characters; letters, numbers, and common punctuation only)',
  })
  recommendations?: string;
}
