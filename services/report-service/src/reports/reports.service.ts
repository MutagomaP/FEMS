import { Injectable } from '@nestjs/common';
import { ComplianceClient } from '../clients/compliance.client';
import { CustomerClient } from '../clients/customer.client';
import { ExtinguisherClient } from '../clients/extinguisher.client';
import { NotificationClient } from '../clients/notification.client';
import { InspectionClient } from '../clients/inspection.client';
import { ReportQueryDto } from './dto/report-query.dto';
import { frequencyToRows } from './export-row.util';
import { ExportResult, ExportService } from './export.service';
import { ReportFormat } from './enums/report-format.enum';

@Injectable()
export class ReportsService {
  constructor(
    private readonly extinguisherClient: ExtinguisherClient,
    private readonly customerClient: CustomerClient,
    private readonly notificationClient: NotificationClient,
    private readonly complianceClient: ComplianceClient,
    private readonly inspectionClient: InspectionClient,
    private readonly exportService: ExportService,
  ) {}

  private params(query: ReportQueryDto) {
    return {
      customerId: query.customerId,
      from: query.from,
      to: query.to,
      days: query.days ?? '90',
    };
  }

  /** Params safe for internal service list endpoints (strict DTO validation). */
  private internalListParams(query: ReportQueryDto) {
    return {
      page: '1',
      limit: '100',
      ...(query.customerId ? { customerId: query.customerId } : {}),
    };
  }

  async expiredExtinguishers(query: ReportQueryDto): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getExpired(this.params(query));
    return this.respond('expired-extinguishers', rows, query.format ?? ReportFormat.CSV);
  }

  async expiringSoon(query: ReportQueryDto): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.extinguisherClient.getExpiringSoon(this.params(query));
    return this.respond('expiring-soon', rows, query.format ?? ReportFormat.CSV);
  }

  async customerCompliance(query: ReportQueryDto): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.complianceClient.getCases(this.internalListParams(query));
    return this.respond('customer-compliance', rows, query.format ?? ReportFormat.CSV);
  }

  async notifications(query: ReportQueryDto): Promise<ExportResult | Record<string, unknown>[]> {
    const rows = await this.notificationClient.getNotifications(this.internalListParams(query));
    return this.respond('notifications', rows, query.format ?? ReportFormat.CSV);
  }

  async inventorySummary(query: ReportQueryDto) {
    const period = query.period ?? 'daily';
    const format = query.format ?? ReportFormat.CSV;
    const rows = await this.extinguisherClient.getAllInventory();
    const grouped = this.groupInventoryByPeriod(rows, period);
    const generatedAt = new Date().toISOString();

    if (format === ReportFormat.PDF || format === ReportFormat.XLSX) {
      const detailRows = Object.entries(grouped).map(([bucket, count]) => ({
        period,
        bucket,
        count,
      }));
      return this.exportService.exportSections(
        `inventory-${period}`,
        [
          {
            title: 'Overview',
            rows: [
              {
                period,
                totalExtinguishers: rows.length,
                generatedAt,
              },
            ],
          },
          { title: 'By period bucket', rows: detailRows },
        ],
        format,
      );
    }

    return this.respond(
      `inventory-${period}`,
      [
        {
          period,
          totalExtinguishers: rows.length,
          summary: grouped,
          generatedAt,
        },
      ],
      format,
    );
  }

  async inspectionsPending(query: ReportQueryDto) {
    const rows = await this.inspectionClient.getInspections('PENDING');
    return this.respond('inspections-pending', rows, query.format ?? ReportFormat.CSV);
  }

  async inspectionsCompleted(query: ReportQueryDto) {
    const rows = await this.inspectionClient.getInspections('COMPLETED');
    return this.respond('inspections-completed', rows, query.format ?? ReportFormat.CSV);
  }

  async inspectionsOverdue(query: ReportQueryDto) {
    const rows = await this.inspectionClient.getInspections('OVERDUE');
    return this.respond('inspections-overdue', rows, query.format ?? ReportFormat.CSV);
  }

  async maintenanceHistory(query: ReportQueryDto) {
    const format = query.format ?? ReportFormat.CSV;
    const rows = await this.inspectionClient.getMaintenanceLogs();
    const frequency = this.groupByField(rows, 'actionTaken');

    if (format === ReportFormat.PDF || format === ReportFormat.XLSX) {
      return this.exportService.exportSections(
        'maintenance-history',
        [
          { title: 'Maintenance logs', rows },
          {
            title: 'Frequency by action',
            rows: [
              ...frequencyToRows(frequency),
              { label: 'totalRecords', count: rows.length },
            ],
          },
        ],
        format,
      );
    }

    const payload = [
      ...rows,
      { _summary: true, frequency, totalRecords: rows.length },
    ];
    return this.respond('maintenance-history', payload, format);
  }

  async maintenanceRecent(query: ReportQueryDto) {
    const rows = await this.inspectionClient.getMaintenanceLogs();
    const recent = rows.slice(0, 20);
    return this.respond('maintenance-recent', recent, query.format ?? ReportFormat.CSV);
  }

  private groupInventoryByPeriod(
    rows: Record<string, unknown>[],
    period: string,
  ): Record<string, number> {
    const field = 'installationDate';
    return rows.reduce<Record<string, number>>((acc, row) => {
      const raw = String(row[field] ?? row['createdAt'] ?? 'unknown');
      let key = raw;
      if (period === 'monthly') key = raw.slice(0, 7);
      if (period === 'yearly') key = raw.slice(0, 4);
      if (period === 'daily') key = raw.slice(0, 10);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  async dashboardSummary(
    query: ReportQueryDto,
  ): Promise<ExportResult | Record<string, unknown>> {
    const params = this.params(query);
    const listParams = this.internalListParams(query);
    const [expired, expiring, compliance, notifications] = await Promise.all([
      this.extinguisherClient.getExpired(params),
      this.extinguisherClient.getExpiringSoon(params),
      this.complianceClient.getCases(listParams),
      this.notificationClient.getNotifications(listParams),
    ]);

    const summary = {
      charts: {
        expiredCount: expired.length,
        expiringSoonCount: expiring.length,
        complianceIssues: compliance.length,
        recentNotifications: notifications.length,
      },
      breakdown: {
        expiredByMonth: this.groupByMonth(expired, 'expiryDate'),
        expiringByDays: this.groupExpiringByDays(expiring),
        complianceByStatus: this.groupByField(compliance, 'caseStatus'),
      },
      generatedAt: new Date().toISOString(),
    };

    if (query.format) {
      return this.exportService.exportSections(
        'dashboard-summary',
        this.dashboardToSections(summary),
        query.format,
      );
    }

    return summary;
  }

  private dashboardToSections(summary: {
    charts: Record<string, number>;
    breakdown: {
      expiredByMonth: Record<string, number>;
      expiringByDays: Record<string, number>;
      complianceByStatus: Record<string, number>;
    };
    generatedAt: string;
  }) {
    const metricRows = Object.entries(summary.charts).map(([metric, value]) => ({
      metric,
      value,
    }));

    const breakdownSection = (title: string, data: Record<string, number>) => ({
      title,
      rows: Object.entries(data).map(([label, count]) => ({ label, count })),
    });

    return [
      {
        title: 'Summary metrics',
        rows: [...metricRows, { metric: 'generatedAt', value: summary.generatedAt }],
      },
      breakdownSection('Expired by month', summary.breakdown.expiredByMonth),
      breakdownSection('Expiring by days', summary.breakdown.expiringByDays),
      breakdownSection('Compliance by status', summary.breakdown.complianceByStatus),
    ];
  }

  private async respond(
    title: string,
    rows: Record<string, unknown>[],
    format: ReportFormat,
  ): Promise<ExportResult | Record<string, unknown>[]> {
    if (format === ReportFormat.CSV && rows.length === 0) {
      return rows;
    }
    return this.exportService.export(title, rows, format);
  }

  private groupByField(rows: Record<string, unknown>[], field: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const key = String(row[field] ?? 'unknown');
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  private groupByMonth(rows: Record<string, unknown>[], dateField: string) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const raw = row[dateField];
      const key =
        raw instanceof Date
          ? `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, '0')}`
          : String(raw ?? 'unknown').slice(0, 7);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }

  private groupExpiringByDays(rows: Record<string, unknown>[]) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      const raw = row.expiryDate;
      if (!raw) {
        acc.unknown = (acc.unknown ?? 0) + 1;
        return acc;
      }
      const expiry = new Date(raw instanceof Date ? raw : String(raw));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiry.setHours(0, 0, 0, 0);
      const days = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
      const key =
        days <= 0
          ? '0 (due)'
          : days <= 7
            ? '1-7 days'
            : days <= 30
              ? '8-30 days'
              : days <= 60
                ? '31-60 days'
                : '61-90 days';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
  }
}
