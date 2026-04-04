import apiClient from './client';

export const adminApi = {
  getDashboard() {
    return apiClient.get('/admin/dashboard');
  },

  getUsers(params) {
    return apiClient.get('/admin/users', { params });
  },

  updateUserStatus(data) {
    return apiClient.put('/admin/users/status', data);
  },

  deleteUser(userId) {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  getConversations(params) {
    return apiClient.get('/admin/conversations', { params });
  },

  getMessages(conversationId, params) {
    return apiClient.get(`/admin/conversations/${conversationId}/messages`, { params });
  },

  getMoments(params) {
    return apiClient.get('/admin/moments', { params });
  },

  deleteMoment(momentId) {
    return apiClient.delete(`/admin/moments/${momentId}`);
  },

  getTables() {
    return apiClient.get('/admin/tables');
  },

  getTableData(tableName, params) {
    return apiClient.get(`/admin/tables/${tableName}`, { params });
  },

  executeQuery(sql) {
    return apiClient.post('/admin/query', { sql });
  }
};