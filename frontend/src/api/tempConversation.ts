import apiClient from './client';

export interface TempConversationCheck {
  isTemp: boolean;
  isBlocked: boolean;
  warningCount: number;
}

export interface TempConversationRecord {
  conversationId: number;
  targetUserId: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const tempConversationApi = {
  check: async (conversationId: number): Promise<TempConversationCheck> => {
    const response = await apiClient.get(`/temp-conversation/${conversationId}/check`, {
      headers: getAuthHeader()
    });
    return response.data?.data || { isTemp: false, isBlocked: false, warningCount: 0 };
  },

  record: async (conversationId: number, targetUserId: number): Promise<void> => {
    await apiClient.post('/temp-conversation/record', { conversationId, targetUserId }, {
      headers: getAuthHeader()
    });
  },

  block: async (conversationId: number): Promise<void> => {
    await apiClient.put(`/temp-conversation/${conversationId}/block`, {}, {
      headers: getAuthHeader()
    });
  }
};