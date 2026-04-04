import apiClient from './client';

export const settingsApi = {
  get() {
    return apiClient.get('/settings');
  },

  update(data) {
    return apiClient.put('/settings', data);
  },

  updateProfile(data) {
    return apiClient.put('/settings/profile', data);
  },

  changePassword(data) {
    return apiClient.put('/settings/password', data);
  }
};