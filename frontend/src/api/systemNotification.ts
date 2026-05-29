import apiClient from './client';
import type { SystemNotification } from '../types';

export interface CreateNotificationData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateNotificationData {
  title?: string;
  content?: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  is_active?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export const systemNotificationApi = {
  getList: () => apiClient.get('/system-notification/list'),
  adminGetList: () => apiClient.get('/system-notification/admin/list'),
  create: (data: CreateNotificationData) => apiClient.post('/system-notification', data),
  update: (id: number, data: UpdateNotificationData) => apiClient.put(`/system-notification/${id}`, data),
  delete: (id: number) => apiClient.delete(`/system-notification/${id}`),
};
