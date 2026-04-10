import { create } from 'zustand';
import { contactApi, Contact } from '../api/contact';

interface ContactState {
  contacts: Contact[];
  pendingRequests: Contact[];
  userStatus: Record<number, number>; // userId -> status (1=online, 0=offline)
  isLoading: boolean;
  error: string | null;

  fetchContacts: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  addContact: (userId: number) => Promise<void>;
  acceptContact: (userId: number) => Promise<void>;
  rejectContact: (userId: number) => Promise<void>;
  deleteContact: (userId: number) => Promise<void>;
  updateUserStatus: (userId: number, status: number) => void;
  clearError: () => void;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  pendingRequests: [],
  userStatus: {},
  isLoading: false,
  error: null,

  fetchContacts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await contactApi.getContactList();
      set({ contacts: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch contacts',
        isLoading: false
      });
    }
  },

  fetchPendingRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await contactApi.getPendingRequests();
      set({ pendingRequests: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch pending requests',
        isLoading: false
      });
    }
  },

  addContact: async (userId) => {
    try {
      await contactApi.addContact(userId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to add contact' });
      throw error;
    }
  },

  acceptContact: async (userId) => {
    try {
      await contactApi.acceptContact(userId);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((c) => c.id !== userId)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to accept contact' });
      throw error;
    }
  },

  rejectContact: async (userId) => {
    try {
      await contactApi.rejectContact(userId);
      set((state) => ({
        pendingRequests: state.pendingRequests.filter((c) => c.id !== userId)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to reject contact' });
      throw error;
    }
  },

  deleteContact: async (userId) => {
    try {
      await contactApi.deleteContact(userId);
      set((state) => ({
        contacts: state.contacts.filter((c) => c.id !== userId)
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete contact' });
      throw error;
    }
  },

  updateUserStatus: (userId: number, status: number) => {
    set((state) => ({
      userStatus: {
        ...state.userStatus,
        [userId]: status
      }
    }));
  },

  clearError: () => {
    set({ error: null });
  }
}));
