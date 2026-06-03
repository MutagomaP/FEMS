import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportFormat } from '../enums/report-format.enum';

export class ReportQueryDto {
  @ApiPropertyOptional({ enum: ReportFormat, description: 'Omit for JSON dashboard; set for file export' })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  days?: string;

  @ApiPropertyOptional({ enum: ['daily', 'monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'monthly', 'yearly'])
  period?: 'daily' | 'monthly' | 'yearly';
}
