import apiClient from './client';

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  created_at: string;
  username: string;
  nickname: string;
  avatar: string;
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
  type?: 'text' | 'image' | 'file';
}

export interface SearchMessageResult extends Message {
  conversation_type: 'single' | 'group';
  conversation_name: string;
}

export const messageApi = {
  sendMessage: (data: SendMessageRequest) =>
    apiClient.post<Message>('/message/send', data),

  getMessageList: (conversationId: number, limit?: number, beforeId?: number) =>
    apiClient.get<Message[]>('/message/list', {
      params: { conversationId, limit, beforeId }
    }),

  searchMessages: (keyword: string, limit?: number) =>
    apiClient.get<SearchMessageResult[]>('/message/search', {
      params: { keyword, limit }
    }),

  markAsRead: (conversationId: number) =>
    apiClient.post('/message/read', { conversationId }),

  recallMessage: (messageId: number) =>
    apiClient.delete(`/message/${messageId}`)
};
