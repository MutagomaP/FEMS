import apiClient from './apiClient';
import type {
  ExtinguisherFilters,
  ExtinguisherSize,
  ExtinguisherType,
  FireExtinguisher,
  PaginatedResult,
} from '@/types';

export interface CreateExtinguisherPayload {
  serialNumber: string;
  location: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
  customerId: string;
}

export interface CreateStockExtinguisherPayload {
  serialNumber: string;
  location?: string;
  type: ExtinguisherType;
  size: ExtinguisherSize;
  installationDate: string;
  expiryDate: string;
}

export interface AssignExtinguisherPayload {
  customerId: string;
  location: string;
}

export type UpdateExtinguisherPayload = Partial<
  CreateExtinguisherPayload & { status: FireExtinguisher['status'] }
>;

export const extinguisherService = {
  listAll: (params: ExtinguisherFilters) =>
    apiClient
      .get<PaginatedResult<FireExtinguisher>>('/extinguishers', { params })
      .then((r) => r.data),

  listMine: (params: ExtinguisherFilters) =>
    apiClient
      .get<PaginatedResult<FireExtinguisher>>('/extinguishers/mine', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<FireExtinguisher>(`/extinguishers/${id}`).then((r) => r.data),

  create: (payload: CreateExtinguisherPayload) =>
    apiClient.post<FireExtinguisher>('/extinguishers', payload).then((r) => r.data),

  update: (id: string, payload: UpdateExtinguisherPayload) =>
    apiClient.patch<FireExtinguisher>(`/extinguishers/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/extinguishers/${id}`).then((r) => r.data),

  listStock: (params?: ExtinguisherFilters) =>
    apiClient
      .get<PaginatedResult<FireExtinguisher>>('/extinguishers/stock', { params })
      .then((r) => r.data),

  createStock: (payload: CreateStockExtinguisherPayload) =>
    apiClient.post<FireExtinguisher>('/extinguishers/stock', payload).then((r) => r.data),

  assign: (id: string, payload: AssignExtinguisherPayload) =>
    apiClient
      .patch<FireExtinguisher>(`/extinguishers/${id}/assign`, payload)
      .then((r) => r.data),
};
