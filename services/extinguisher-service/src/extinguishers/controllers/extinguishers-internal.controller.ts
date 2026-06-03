import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { RenewExtinguisherDto } from '../dtos/update-extinguisher.dto';
import { ExtinguisherStatus } from '../entities/extinguisher-status.enum';
import { ExtinguishersService } from '../services/extinguishers.service';

@ApiTags('internal')
@Controller('internal/extinguishers')
@UseGuards(ServiceAuthGuard)
export class ExtinguishersInternalController {
  constructor(private readonly extinguishersService: ExtinguishersService) {}

  @Get('expired')
  expired() {
    return this.extinguishersService.findReportByStatus(ExtinguisherStatus.EXPIRED);
  }

  @Get('expiring')
  expiring() {
    return this.extinguishersService.findReportByStatus(
      ExtinguisherStatus.EXPIRING_SOON,
    );
  }

  @Get('inventory/all')
  inventoryAll() {
    return this.extinguishersService.findAllForCron();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.extinguishersService.findById(id);
  }

  @Patch(':id/renew')
  renew(@Param('id') id: string, @Body() dto: RenewExtinguisherDto) {
    return this.extinguishersService.renew(id, dto);
  }
}
