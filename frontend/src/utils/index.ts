import clsx, { type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

import type { ExtinguisherSize, ExtinguisherType } from '@/types';

const SIZE_LABELS: Record<ExtinguisherSize, string> = {
  '2.5_LB': '2.5 lbs.',
  '5_LB': '5 lbs.',
  '9_LB': '9 lbs.',
  '12_LB': '12 lbs.',
};

export function formatExtinguisherSize(size: ExtinguisherSize | string): string {
  return SIZE_LABELS[size as ExtinguisherSize] ?? String(size).replace(/_LB$/, ' lbs.').replace('_', '.');
}

const TYPE_LABELS: Record<ExtinguisherType, string> = {
  WATER: 'Water',
  CO2: 'CO₂',
  FOAM: 'Foam',
  DRY_CHEMICAL: 'Dry chemical',
};

export function formatExtinguisherType(type: ExtinguisherType | string): string {
  return TYPE_LABELS[type as ExtinguisherType] ?? String(type).replace(/_/g, ' ');
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function recordToChartData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
