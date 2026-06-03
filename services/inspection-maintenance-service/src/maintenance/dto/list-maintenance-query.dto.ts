import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@fems/shared';

export class ListMaintenanceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  extinguisherId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  inspectorUserId?: string;
}
