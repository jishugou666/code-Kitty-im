import { create } from 'zustand';
import { conversationApi, Conversation } from '../api/conversation';
import { messageApi, Message } from '../api/message';
import { smartScheduler, type RequestPriority } from '../lib/smartScheduler';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<number, Message[]>;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number;
  fetchCooldown: number;

  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: number, forceRefresh?: boolean) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  clearError: () => void;
}

const FETCH_COOLDOWN = 3000;

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  isLoading: false,
  error: null,
  lastFetchTime: 0,
  fetchCooldown: FETCH_COOLDOWN,

  fetchConversations: async (forceRefresh = false) => {
    const { lastFetchTime, fetchCooldown, isLoading } = get();
    const now = Date.now();

    if (!forceRefresh && now - lastFetchTime < fetchCooldown) {
      return;
    }

    if (isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await smartScheduler.schedule(
        async () => {
          const response = await conversationApi.getList();
          return response;
        },
        'normal',
        2
      ).then(response => {
        set({
          conversations: response.data || [],
          isLoading: false,
          lastFetchTime: Date.now()
        });
      }).catch(error => {
        set({
          error: error.message || 'Failed to fetch conversations',
          isLoading: false
        });
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

  fetchMessages: async (conversationId, forceRefresh = false) => {
    const { messages, isLoading, lastFetchTime, fetchCooldown } = get();
    const now = Date.now();
    const cachedMessages = messages[conversationId];

    if (!forceRefresh && cachedMessages && cachedMessages.length > 0 && now - lastFetchTime < fetchCooldown) {
      return;
    }

    if (isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await smartScheduler.schedule(
        async () => {
          const response = await messageApi.getMessageList(conversationId);
          return response;
        },
        'high',
        3
      ).then(response => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: response.data || []
          },
          isLoading: false
        }));
      }).catch(error => {
        set({
          error: error.message || 'Failed to fetch messages',
          isLoading: false
        });
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch messages',
        isLoading: false
      });
    }
  },

  sendMessage: async (conversationId, content) => {
    try {
      const response = await smartScheduler.schedule(
        async () => {
          return await messageApi.sendMessage({
            conversationId,
            content,
            type: 'text'
          });
        },
        'critical',
        2
      );

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
