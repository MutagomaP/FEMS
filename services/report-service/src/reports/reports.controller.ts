import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard, Roles, RolesGuard, UserRole } from '@fems/shared';
import { ReportQueryDto } from './dto/report-query.dto';
import { ExportResult } from './export.service';
import { ReportsService } from './reports.service';

function isExportResult(value: unknown): value is ExportResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'buffer' in value &&
    'contentType' in value &&
    'filename' in value
  );
}

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('expired-extinguishers')
  async expiredExtinguishers(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.expiredExtinguishers(query), res);
  }

  @Get('expiring-soon')
  async expiringSoon(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.expiringSoon(query), res);
  }

  @Get('customer-compliance')
  async customerCompliance(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.customerCompliance(query), res);
  }

  @Get('notifications')
  async notifications(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.notifications(query), res);
  }

  @Get('inventory-summary')
  async inventorySummary(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.inventorySummary(query), res);
  }

  @Get('inspections-pending')
  async inspectionsPending(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.inspectionsPending(query), res);
  }

  @Get('inspections-completed')
  async inspectionsCompleted(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.inspectionsCompleted(query), res);
  }

  @Get('inspections-overdue')
  async inspectionsOverdue(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.inspectionsOverdue(query), res);
  }

  @Get('maintenance-history')
  async maintenanceHistory(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.maintenanceHistory(query), res);
  }

  @Get('maintenance-recent')
  async maintenanceRecent(@Query() query: ReportQueryDto, @Res() res: Response) {
    return this.sendReport(await this.reportsService.maintenanceRecent(query), res);
  }

  @Get('dashboard-summary')
  async dashboardSummary(@Query() query: ReportQueryDto, @Res() res: Response) {
    const result = await this.reportsService.dashboardSummary(query);
    if (isExportResult(result)) {
      return this.sendReport(result, res);
    }
    return res.json(result);
  }

  private sendReport(result: ExportResult | Record<string, unknown>[], res: Response) {
    if (isExportResult(result)) {
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }
    return res.json({ data: result });
  }
}
