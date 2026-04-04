import apiClient from './client';

export interface Conversation {
  id: number;
  type: 'single' | 'group';
  name: string;
  avatar: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: number;
  role: string;
}

export const conversationApi = {
  getList: () =>
    apiClient.get<Conversation[]>('/conversation/list'),

  getConversation: (id: number) =>
    apiClient.get<Conversation>(`/conversation/${id}`),

  createSingle: (userId: number) =>
    apiClient.post<{ id: number } & Conversation>('/conversation/single', { userId }),

  createGroup: (name: string, memberIds?: number[]) =>
    apiClient.post<{ id: number } & Conversation>('/conversation/group', { name, memberIds }),

  getMembers: (id: number) =>
    apiClient.get<ConversationMember[]>(`/conversation/${id}/members`),

  addMembers: (id: number, memberIds: number[]) =>
    apiClient.post<ConversationMember[]>(`/conversation/${id}/members`, { memberIds }),

  removeMember: (id: number, userId: number) =>
    apiClient.delete(`/conversation/${id}/members/${userId}`)
};
