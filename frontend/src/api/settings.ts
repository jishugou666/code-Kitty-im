import { client } from './client';

export const settingsApi = {
  get() {
    return client.get('/settings');
  },

  update(data) {
    return client.put('/settings', data);
  },

  updateProfile(data) {
    return client.put('/settings/profile', data);
  },

  changePassword(data) {
    return client.put('/settings/password', data);
  }
};