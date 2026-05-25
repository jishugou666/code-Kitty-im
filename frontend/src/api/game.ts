import apiClient from './client';

export interface GameMatch {
  id: number;
  game_type: 'gomoku' | 'tictactoe' | 'chess';
  mode: 'ai' | 'pvp';
  player1_id: number;
  player2_id: number | null;
  winner_id: number | null;
  status: 'playing' | 'finished' | 'abandoned';
  ai_difficulty: 'easy' | 'medium' | 'hard';
  moves: any[];
  duration_seconds: number | null;
  score_change: number | null;
  created_at: string;
  finished_at: string | null;
}

export interface UserProfile {
  user_id: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  peak_rating: number;
  rank_tier: string;
  gomoku_wins: number; gomoku_losses: number;
  tictactoe_wins: number; tictactoe_losses: number;
  chess_wins: number; chess_losses: number;
  current_win_streak: number;
  best_win_streak: number;
}

export interface LeaderboardEntry {
  user_id: number;
  nickname: string;
  avatar: string | null;
  rating: number;
  rank_tier: string;
  wins: number;
  losses: number;
  total_games: number;
  win_rate: number;
}

export interface RankTier {
  tier: string;
  name: string;
  min: number;
  color: string;
}

export const gameApi = {
  createMatch: (data: { gameType: string; mode?: string; aiDifficulty?: string }) =>
    apiClient.post<GameMatch>('/game', data),

  move: (matchId: number, data: { position: number[]; symbol: string }) =>
    apiClient.post(`/game/${matchId}/move`, data),

  surrender: (matchId: number) =>
    apiClient.post(`/game/${matchId}/surrender`),

  finish: (matchId: number, data: { won: boolean, status?: 'finished' | 'abandoned' }) =>
    apiClient.post(`/game/${matchId}/finish`, data),

  getProfile: () =>
    apiClient.get<UserProfile>('/game/profile'),

  getLeaderboard: (params?: { game_type?: string; limit?: number }) =>
    apiClient.get<LeaderboardEntry[]>('/game/leaderboard', { params }),

  getHistory: (params?: { limit?: number }) =>
    apiClient.get<GameMatch[]>('/game/history', { params }),
};
