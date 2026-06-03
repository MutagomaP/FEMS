import apiClient from './apiClient';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  getMe: () => apiClient.get<User>('/users/me').then((r) => r.data),

  updateProfile: (payload: { firstName?: string; lastName?: string }) =>
    apiClient.patch<User>('/users/me', payload).then((r) => r.data),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/users/me/change-password', payload).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient
      .post<{ message: string; devOtp?: string; devNote?: string }>(
        '/auth/forgot-password',
        { email },
      )
      .then((r) => r.data),

  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', payload).then((r) => r.data),
};
