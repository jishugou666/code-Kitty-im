import request from '../utils/request';

export const systemNotificationApi = {
  getList: () => request.get('/system-notification/list'),
  adminGetList: () => request.get('/system-notification/admin/list'),
  create: (data: any) => request.post('/system-notification', data),
  update: (id: number, data: any) => request.put(`/system-notification/${id}`, data),
  delete: (id: number) => request.delete(`/system-notification/${id}`),
};
