import apiClient from './apiClient';
import type { DashboardSummary, ReportFormat, ReportType } from '@/types';

export interface ReportQuery {
  format?: ReportFormat;
  customerId?: string;
  from?: string;
  to?: string;
  days?: string;
  period?: 'daily' | 'monthly' | 'yearly';
}

function normalizeDashboardSummary(body: unknown): DashboardSummary {
  const raw =
    body && typeof body === 'object' && 'charts' in body
      ? (body as DashboardSummary)
      : body && typeof body === 'object' && 'data' in body
        ? (body as { data: DashboardSummary }).data
        : null;

  return {
    charts: raw?.charts ?? {
      expiredCount: 0,
      expiringSoonCount: 0,
      complianceIssues: 0,
      recentNotifications: 0,
    },
    breakdown: {
      expiredByMonth: raw?.breakdown?.expiredByMonth ?? {},
      expiringByDays: raw?.breakdown?.expiringByDays ?? {},
      complianceByStatus: raw?.breakdown?.complianceByStatus ?? {},
    },
    generatedAt: raw?.generatedAt ?? new Date().toISOString(),
  };
}

export const reportService = {
  getDashboardSummary: (params?: ReportQuery) =>
    apiClient
      .get('/reports/dashboard-summary', {
        params: params ? { days: params.days, customerId: params.customerId } : undefined,
      })
      .then((r) => normalizeDashboardSummary(r.data)),

  downloadReport: async (type: ReportType, params: ReportQuery) => {
    return downloadReportBlob(`/reports/${type}`, params, `${type}.${params.format ?? 'csv'}`);
  },
};

async function downloadReportBlob(
  path: string,
  params: ReportQuery,
  fallbackFilename: string,
) {
  const response = await apiClient.get(path, {
    params,
    responseType: 'blob',
  });

  const blob = response.data as Blob;
  if (blob.type.includes('application/json')) {
    const text = await blob.text();
    const body = JSON.parse(text) as { message?: string };
    throw new Error(body.message ?? 'Report export failed');
  }

  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="(.+)"/);
  const filename = filenameMatch?.[1] ?? fallbackFilename;

  return { blob, filename };
}
