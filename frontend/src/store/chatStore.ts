import { create } from 'zustand';
import { conversationApi, Conversation } from '../api/conversation';
import { messageApi, Message } from '../api/message';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<number, Message[]>;
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await conversationApi.getList();
      set({
        conversations: response.data,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch conversations',
        isLoading: false
      });
    }
  },

  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await messageApi.getMessageList(conversationId);
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: response.data
        },
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch messages',
        isLoading: false
      });
    }
  },

  sendMessage: async (conversationId, content) => {
    try {
      const response = await messageApi.sendMessage({
        conversationId,
        content,
        type: 'text'
      });
      const newMessage = response.data;
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [...(state.messages[conversationId] || []), newMessage]
        }
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to send message' });
      throw error;
    }
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message]
        }
      };
    });
  },

  clearError: () => {
    set({ error: null });
  }
}));
