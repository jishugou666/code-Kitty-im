import apiClient from './client';

export const groupApi = {
  create(data) {
    return apiClient.post('/group', data);
  },

  getList() {
    return apiClient.get('/group');
  },

  getInfo(groupId) {
    return apiClient.get(`/group/${groupId}`);
  },

  search(keyword) {
    return apiClient.get('/group/search', { params: { keyword } });
  },

  join(groupId) {
    return apiClient.post(`/group/${groupId}/join`);
  },

  leave(groupId) {
    return apiClient.post(`/group/${groupId}/leave`);
  },

  setAdmin(groupId, userId, isAdmin) {
    return apiClient.put(`/group/${groupId}/admin/${userId}`, { isAdmin });
  },

  removeMember(groupId, userId) {
    return apiClient.delete(`/group/${groupId}/members/${userId}`);
  },

  muteMember(groupId, userId, durationMinutes) {
    return apiClient.put(`/group/${groupId}/members/${userId}/mute`, { durationMinutes });
  },

  getJoinRequests(groupId) {
    return apiClient.get(`/group/${groupId}/requests`);
  },

  handleJoinRequest(groupId, requestId, approved) {
    return apiClient.put(`/group/${groupId}/requests/${requestId}`, { approved });
  },

  update(groupId, data) {
    return apiClient.put(`/group/${groupId}`, data);
  },

  delete(groupId) {
    return apiClient.delete(`/group/${groupId}`);
  }
};