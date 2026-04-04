import { client } from './client';

export const adminApi = {
  getDashboard() {
    return client.get('/admin/dashboard');
  },

  getUsers(params) {
    return client.get('/admin/users', { params });
  },

  updateUserStatus(data) {
    return client.put('/admin/users/status', data);
  },

  deleteUser(userId) {
    return client.delete(`/admin/users/${userId}`);
  },

  getConversations(params) {
    return client.get('/admin/conversations', { params });
  },

  getMessages(conversationId, params) {
    return client.get(`/admin/conversations/${conversationId}/messages`, { params });
  },

  getMoments(params) {
    return client.get('/admin/moments', { params });
  },

  deleteMoment(momentId) {
    return client.delete(`/admin/moments/${momentId}`);
  },

  getTables() {
    return client.get('/admin/tables');
  },

  getTableData(tableName, params) {
    return client.get(`/admin/tables/${tableName}`, { params });
  },

  executeQuery(sql) {
    return client.post('/admin/query', { sql });
  }
};