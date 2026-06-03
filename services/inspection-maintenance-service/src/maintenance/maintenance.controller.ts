import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  JwtPayload,
  Roles,
  RolesGuard,
  UserRole,
} from '@fems/shared';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { ListMaintenanceQueryDto } from './dto/list-maintenance-query.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(UserRole.INSPECTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Log maintenance activity' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'List maintenance logs' })
  findAll(@Query() query: ListMaintenanceQueryDto) {
    return this.maintenanceService.findAll(query);
  }

  @Get('mine')
  @Roles(UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Maintenance logs recorded by current inspector' })
  findMine(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMaintenanceQueryDto,
  ) {
    return this.maintenanceService.findAll({
      ...query,
      inspectorUserId: user.sub,
    });
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.INSPECTOR)
  @ApiOperation({ summary: 'Delete a maintenance log' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const row = await this.maintenanceService.findById(id);
    if (user.role === UserRole.INSPECTOR && row.inspectorUserId !== user.sub) {
      throw new ForbiddenException('You can only delete maintenance logs you created');
    }
    await this.maintenanceService.remove(id);
    return { deleted: true };
  }
}
