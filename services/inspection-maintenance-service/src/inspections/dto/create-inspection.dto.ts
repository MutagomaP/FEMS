import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateInspectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  extinguisherId: string;

  @ApiProperty({ example: '2026-06-15' })
  @IsDateString()
  inspectionDate: string;

  @ApiProperty({ example: '09:30', description: '24-hour HH:mm' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'inspectionTime must be HH:mm (24-hour)',
  })
  inspectionTime: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Required when admin schedules for a customer' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inspectorUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
