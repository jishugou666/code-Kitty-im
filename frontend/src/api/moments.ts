import apiClient from './client';

export const momentsApi = {
  create(data) {
    return apiClient.post('/moments', data);
  },

  getList(params) {
    return apiClient.get('/moments/list', { params });
  },

  delete(id) {
    return apiClient.delete(`/moments/${id}`);
  },

  like(id) {
    return apiClient.post(`/moments/${id}/like`);
  },

  getComments(id) {
    return apiClient.get(`/moments/${id}/comments`);
  },

  addComment(id, data) {
    return apiClient.post(`/moments/${id}/comments`, data);
  },

  deleteComment(commentId) {
    return apiClient.delete(`/moments/comments/${commentId}`);
  },

  getUserMoments(userId, params) {
    return apiClient.get(`/moments/user/${userId}`, { params });
  }
};