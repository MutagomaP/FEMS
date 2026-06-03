import apiClient from './apiClient';
import type {
  CreateInspectionPayload,
  InspectionSchedule,
  PaginatedResult,
} from '@/types';

export const inspectionService = {
  list: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<InspectionSchedule>>('/inspections', { params })
      .then((r) => r.data),

  listAssigned: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<InspectionSchedule>>('/inspections/assigned', { params })
      .then((r) => r.data),

  listMine: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<InspectionSchedule>>('/inspections/mine', { params })
      .then((r) => r.data),

  history: (params?: Record<string, string | number | undefined>) =>
    apiClient
      .get<PaginatedResult<InspectionSchedule>>('/inspections/history', { params })
      .then((r) => r.data),

  create: (payload: CreateInspectionPayload) =>
    apiClient.post<InspectionSchedule>('/inspections', payload).then((r) => r.data),

  complete: (id: string) =>
    apiClient.patch<InspectionSchedule>(`/inspections/${id}/complete`).then((r) => r.data),

  cancel: (id: string) =>
    apiClient.patch<InspectionSchedule>(`/inspections/${id}/cancel`).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/inspections/${id}`).then((r) => r.data),
};
