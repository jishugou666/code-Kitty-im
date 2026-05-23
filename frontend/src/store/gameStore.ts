import { create } from 'zustand';
import { gameApi, GameMatch, UserProfile, LeaderboardEntry } from '../api/game';

interface GameState {
  profile: UserProfile | null;
  leaderboard: LeaderboardEntry[];
  currentMatch: GameMatch | null;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  fetchLeaderboard: (gameType?: string) => Promise<void>;
  createMatch: (gameType: string, mode?: string, difficulty?: string) => Promise<GameMatch>;
  makeMove: (matchId: number, position: number[], symbol: string) => Promise<void>;
  surrender: (matchId: number) => Promise<void>;
  clearError: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  profile: null,
  leaderboard: [],
  currentMatch: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.getProfile();
      set({
        profile: response.data,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch game profile',
        isLoading: false
      });
    }
  },

  fetchLeaderboard: async (gameType?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = gameType ? { game_type: gameType, limit: 10 } : { limit: 10 };
      const response = await gameApi.getLeaderboard(params);
      set({
        leaderboard: response.data,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch leaderboard',
        isLoading: false
      });
    }
  },

  createMatch: async (gameType: string, mode = 'ai', difficulty = 'medium') => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.createMatch({
        game_type: gameType,
        mode: mode,
        ai_difficulty: difficulty
      });
      const match = response.data;
      set({
        currentMatch: match,
        isLoading: false
      });
      return match;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create match',
        isLoading: false
      });
      throw error;
    }
  },

  makeMove: async (matchId: number, position: number[], symbol: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.move(matchId, { position, symbol });
      const updatedMatch = response.data;
      set((state) => ({
        currentMatch: updatedMatch || state.currentMatch,
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to make move',
        isLoading: false
      });
      throw error;
    }
  },

  surrender: async (matchId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await gameApi.surrender(matchId);
      const updatedMatch = response.data;
      set((state) => ({
        currentMatch: updatedMatch || state.currentMatch,
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to surrender',
        isLoading: false
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
