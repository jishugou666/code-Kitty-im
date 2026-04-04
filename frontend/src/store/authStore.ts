import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { userApi, UserProfile, LoginRequest, RegisterRequest } from '../api/user';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
  clearError: () => void;
}

const localStorageWithTokenFallback = {
  getItem: (name: string): string | null => {
    if (name === 'auth-storage') {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        return authData;
      }
    }
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(name, value);
    if (name === 'auth-storage') {
      try {
        const parsed = JSON.parse(value);
        if (parsed.state?.token) {
          localStorage.setItem('token', parsed.state.token);
        } else {
          localStorage.removeItem('token');
        }
      } catch {
      }
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
    if (name === 'auth-storage') {
      localStorage.removeItem('token');
    }
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userApi.login(data);
          const { user, token } = response.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await userApi.register(data);
          const { user, token } = response.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await userApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      loadUser: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true });
        try {
          const response = await userApi.getProfile();
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      updateUser: (user: UserProfile) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorageWithTokenFallback),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
