import apiClient from './client';

export const systemNotificationApi = {
  getList: () => apiClient.get('/system-notification/list'),
  adminGetList: () => apiClient.get('/system-notification/admin/list'),
  create: (data: any) => apiClient.post('/system-notification', data),
  update: (id: number, data: any) => apiClient.put(`/system-notification/${id}`, data),
  delete: (id: number) => apiClient.delete(`/system-notification/${id}`),
};
