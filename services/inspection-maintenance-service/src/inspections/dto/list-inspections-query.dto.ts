import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@fems/shared';
import { InspectionStatus } from '../../enums/inspection-status.enum';

export class ListInspectionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  extinguisherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned inspector user id' })
  @IsOptional()
  @IsUUID()
  inspectorUserId?: string;
}
