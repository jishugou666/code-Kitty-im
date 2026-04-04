import apiClient from './client';

export interface Contact {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: number;
  added_at: string;
}

export const contactApi = {
  getContactList: () =>
    apiClient.get<Contact[]>('/contact/list'),

  getPendingRequests: () =>
    apiClient.get<Contact[]>('/contact/requests'),

  addContact: (userId: number) =>
    apiClient.post('/contact/add', { userId }),

  acceptContact: (userId: number) =>
    apiClient.post('/contact/accept', { userId }),

  rejectContact: (userId: number) =>
    apiClient.post('/contact/reject', { userId }),

  blockContact: (userId: number) =>
    apiClient.post('/contact/block', { userId }),

  unblockContact: (userId: number) =>
    apiClient.post('/contact/unblock', { userId }),

  deleteContact: (userId: number) =>
    apiClient.delete(`/contact/${userId}`)
};
