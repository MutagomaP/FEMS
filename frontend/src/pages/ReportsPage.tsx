import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import type { ReportFormat, ReportType } from '@/types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { downloadReport } from '@/store/slices/reportSlice';
import { downloadBlob } from '@/utils';
import type { ReportQuery } from '@/services/reportService';

type ReportConfig = {
  type: ReportType;
  title: string;
  description: string;
  params?: ReportQuery;
  showPeriod?: boolean;
};

const reports: ReportConfig[] = [
  {
    type: 'expired-extinguishers',
    title: 'Expired Extinguishers',
    description: 'All extinguishers past their expiry date',
  },
  {
    type: 'expiring-soon',
    title: 'Expiring Soon',
    description: 'Units approaching expiry within configured window',
    params: { days: '90' },
  },
  {
    type: 'customer-compliance',
    title: 'Customer Compliance',
    description: 'Compliance summary across customers',
  },
  {
    type: 'notifications',
    title: 'Notifications',
    description: 'Notification delivery history',
  },
  {
    type: 'inventory-summary',
    title: 'Inventory Summary',
    description: 'Daily, monthly, or yearly inventory rollup',
    showPeriod: true,
  },
  {
    type: 'inspections-pending',
    title: 'Pending Inspections',
    description: 'Scheduled inspections awaiting completion',
  },
  {
    type: 'inspections-completed',
    title: 'Completed Inspections',
    description: 'Inspections marked as completed',
  },
  {
    type: 'inspections-overdue',
    title: 'Overdue Inspections',
    description: 'Inspections past their scheduled date',
  },
  {
    type: 'maintenance-history',
    title: 'Maintenance History',
    description: 'Full maintenance log with frequency summary',
  },
  {
    type: 'maintenance-recent',
    title: 'Recent Maintenance',
    description: 'Latest maintenance activities',
  },
];

export function ReportsPage() {
  const dispatch = useAppDispatch();
  const { downloading, error } = useAppSelector((state) => state.reports);
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [inventoryPeriod, setInventoryPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [downloadingType, setDownloadingType] = useState<ReportType | null>(null);

  const handleDownload = async (report: ReportConfig) => {
    setDownloadingType(report.type);
    const params: ReportQuery = {
      format,
      ...report.params,
      ...(report.showPeriod ? { period: inventoryPeriod } : {}),
    };
    const result = await dispatch(downloadReport({ type: report.type, params }));
    if (downloadReport.fulfilled.match(result)) {
      downloadBlob(result.payload.blob, result.payload.filename);
    }
    setDownloadingType(null);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Reports"
        description="Export operational data as PDF, Excel, or CSV"
        action={
          <div className="flex gap-3">
            <div className="w-40">
              <Select
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                options={[
                  { value: 'csv', label: 'CSV' },
                  { value: 'xlsx', label: 'XLSX' },
                  { value: 'pdf', label: 'PDF' },
                ]}
              />
            </div>
            <div className="w-40">
              <Select
                label="Inventory period"
                value={inventoryPeriod}
                onChange={(e) =>
                  setInventoryPeriod(e.target.value as 'daily' | 'monthly' | 'yearly')
                }
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
              />
            </div>
          </div>
        }
      />

      {error && <p className="mb-4 text-sm text-ember-600">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.type} title={report.title} description={report.description}>
            <Button
              loading={downloading && downloadingType === report.type}
              onClick={() => handleDownload(report)}
            >
              Download {format.toUpperCase()}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
