import { axiosAuth } from './axios';

export interface TempConversationCheck {
  isTemp: boolean;
  isBlocked: boolean;
  warningCount: number;
}

export interface TempConversationRecord {
  conversationId: number;
  targetUserId: number;
}

export const tempConversationApi = {
  check: async (conversationId: number): Promise<TempConversationCheck> => {
    const response = await axiosAuth.get(`/temp-conversation/${conversationId}/check`);
    return response.data.data || { isTemp: false, isBlocked: false, warningCount: 0 };
  },

  record: async (conversationId: number, targetUserId: number): Promise<void> => {
    await axiosAuth.post('/temp-conversation/record', { conversationId, targetUserId });
  },

  block: async (conversationId: number): Promise<void> => {
    await axiosAuth.put(`/temp-conversation/${conversationId}/block`);
  }
};