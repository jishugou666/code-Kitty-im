import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { conversationApi, Conversation } from '../api/conversation';
import { messageApi, Message } from '../api/message';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<number, Message[]>;
  readStatus: Record<number, string>; // conversationId -> last read timestamp
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  setCurrentConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: number) => Promise<void>;
  sendMessage: (conversationId: number, content: string) => Promise<void>;
  addMessage: (conversationId: number, message: Message) => void;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  markAsRead: (conversationId: number) => Promise<void>;
  setReadStatus: (conversationId: number, timestamp: string) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: {},
  readStatus: {},
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

  setConversations: (conversations: Conversation[]) => {
    set({ conversations });
  },

  setMessages: (conversationId: number, messages: Message[]) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages
      }
    }));
  },

  markAsRead: async (conversationId: number) => {
    try {
      await messageApi.markAsRead(conversationId);
      const timestamp = new Date().toISOString();
      set((state) => ({
        readStatus: {
          ...state.readStatus,
          [conversationId]: timestamp
        }
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark as read' });
      throw error;
    }
  },

  setReadStatus: (conversationId: number, timestamp: string) => {
    set((state) => ({
      readStatus: {
        ...state.readStatus,
        [conversationId]: timestamp
      }
    }));
  },

  clearError: () => {
    set({ error: null });
  }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
        messages: state.messages,
        readStatus: state.readStatus
      })
    }
  )
);
