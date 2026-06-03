import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServiceAuthGuard } from '@fems/shared';
import { InspectionStatus } from '../enums/inspection-status.enum';
import { InspectionsService } from '../inspections/inspections.service';
import { MaintenanceService } from '../maintenance/maintenance.service';

@ApiTags('internal')
@Controller('internal')
@UseGuards(ServiceAuthGuard)
export class InspectionReportController {
  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly maintenanceService: MaintenanceService,
  ) {}

  @Get('inspections/report')
  async inspectionsReport(@Query('status') status?: InspectionStatus) {
    const rows = await this.inspectionsService.findForReport({ status, limit: 1000 });
    return rows.map((r) => ({
      id: r.id,
      extinguisherId: r.extinguisherId,
      customerId: r.customerId,
      inspectionDate: r.inspectionDate,
      inspectionTime: r.inspectionTime,
      status: r.status,
      inspectorUserId: r.inspectorUserId,
      createdAt: r.createdAt,
    }));
  }

  @Get('maintenance/report')
  async maintenanceReport() {
    const rows = await this.maintenanceService.findForReport(1000);
    return rows.map((r) => ({
      id: r.id,
      extinguisherId: r.extinguisherId,
      inspectorUserId: r.inspectorUserId,
      actionTaken: r.actionTaken,
      maintenanceDate: r.maintenanceDate,
      issuesIdentified: r.issuesIdentified,
      notes: r.notes,
      createdAt: r.createdAt,
    }));
  }
}
