import apiClient from './apiClient';
import type { CreateMaintenancePayload, MaintenanceLog, PaginatedResult } from '@/types';

export const maintenanceService = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<MaintenanceLog>>('/maintenance', { params })
      .then((r) => r.data),

  listMine: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<MaintenanceLog>>('/maintenance/mine', { params })
      .then((r) => r.data),

  create: (payload: CreateMaintenancePayload) =>
    apiClient.post<MaintenanceLog>('/maintenance', payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/maintenance/${id}`).then((r) => r.data),
};
