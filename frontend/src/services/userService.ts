import apiClient from './apiClient';
import type { PaginatedResult, User, UserRole } from '@/types';

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
}

export const userService = {
  list: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResult<User>>('/users', { params }).then((r) => r.data),

  listInspectors: () => apiClient.get<User[]>('/users/inspectors').then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload).then((r) => r.data),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete<{ deleted: boolean }>(`/users/${id}`).then((r) => r.data),
};
