import { client } from './client';

export const momentsApi = {
  create(data) {
    return client.post('/moments', data);
  },

  getList(params) {
    return client.get('/moments/list', { params });
  },

  delete(id) {
    return client.delete(`/moments/${id}`);
  },

  like(id) {
    return client.post(`/moments/${id}/like`);
  },

  getComments(id) {
    return client.get(`/moments/${id}/comments`);
  },

  addComment(id, data) {
    return client.post(`/moments/${id}/comments`, data);
  },

  deleteComment(commentId) {
    return client.delete(`/moments/comments/${commentId}`);
  },

  getUserMoments(userId, params) {
    return client.get(`/moments/user/${userId}`, { params });
  }
};