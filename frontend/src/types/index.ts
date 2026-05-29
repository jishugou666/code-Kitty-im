// ============================================================
// Code Kitty IM - 共享TypeScript类型定义
// 版本: v2.0 | 最后更新: 2026-05-29
// ============================================================

// ==================== 用户相关 ====================
export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  status: number;
  role?: 'user' | 'admin' | 'tech_god';
  created_at: string;
}

export interface UserProfile extends User {
  total_games?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  rating?: number;
  peak_rating?: number;
  rank_tier?: string;
}

// ==================== 会话相关 ====================
export interface Conversation {
  id: number;
  type: 'single' | 'group' | 'notification' | 'world';
  name: string;
  avatar: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  role?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
  members?: ConversationMember[];
}

export interface ConversationMember {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: number;
  role: string;
}

// ==================== 消息相关 ====================
export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: 'text' | 'image' | 'file' | 'system' | 'recalled';
  content: string;
  created_at: string;
  updated_at?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  is_read?: boolean;
  recalled_at?: string;
}

export interface PusherMessageEvent {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: string;
  content: string;
  created_at: string;
  sender_nickname?: string;
  sender_avatar?: string;
}

export interface PusherMessageRecallEvent {
  messageId: number;
  conversationId: number;
  userId: number;
}

// ==================== 联系人相关 ====================
export interface Contact {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: number;
  added_at: string;
}

// ==================== 游戏相关 ====================
export interface GameMoveEvent {
  matchId: number;
  position: number[];
  symbol: string;
  userId: number;
  moveCount: number;
  timestamp: string;
}

export interface GameSurrenderEvent {
  matchId: number;
  userId: number;
  timestamp: string;
}

export interface GameFinishedEvent {
  matchId: number;
  winnerId: number | null;
  status: string;
  scoreChange: number | null;
  timestamp: string;
}

export interface GameMatch {
  id: number;
  game_type: 'gomoku' | 'tictactoe' | 'chess';
  mode: 'ai' | 'pvp';
  player1_id: number;
  player2_id: number | null;
  winner_id: number | null;
  status: 'playing' | 'finished' | 'abandoned';
  ai_difficulty: 'easy' | 'medium' | 'hard';
  moves: GameMove[];
  duration_seconds: number | null;
  score_change: number | null;
  created_at: string;
  finished_at: string | null;
  performance_score: number | null;
  performance_grade: string | null;
  performance_title: string | null;
  highlights: string[] | null;
  performance_details: Record<string, unknown> | null;
}

export interface GameMove {
  position: number[] | [number, number];
  symbol: string;
  user_id: number;
  move_count: number;
  timestamp: string;
}

export interface GameUserProfile {
  user_id: number;
  total_games: number;
  wins: number;
  losses: number;
  draws: number;
  rating: number;
  peak_rating: number;
  rank_tier: string;
  gomoku_wins: number;
  gomoku_losses: number;
  tictactoe_wins: number;
  tictactoe_losses: number;
  chess_wins: number;
  chess_losses: number;
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

export interface PerformanceResult {
  score: number;
  grade: string;
  gradeLabel: string;
  gradeColor: string;
  bgGradient: string;
  title: string;
  ratingChange: number;
  rawRatingChange: number;
  difficultyCoeff: number;
  strengthCoeff: number;
  highlights: PerformanceHighlight[];
  performanceBonuses: PerformanceBonus[];
  breakdown: Record<string, unknown>;
}

export interface PerformanceHighlight {
  key: string;
  icon: string;
  name: string;
  desc: string;
  bonus: number;
}

export interface PerformanceBonus {
  key: string;
  value: number;
  label: string;
}

// ==================== AI相关 ====================
export interface AIServiceStats {
  name: string;
  status: string;
  description: string;
  details: Record<string, unknown>;
  features?: string[];
  config?: Record<string, unknown>;
}

export interface AIFeedback {
  id: number;
  type: 'spam' | 'malicious' | 'suspicious' | 'flood' | 'repeat' | 'sensitive';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id: number;
  target_type: 'message' | 'user' | 'conversation' | 'moments';
  target_id: number;
  content: string;
  content_full: string;
  metadata: Record<string, unknown>;
  ai_confidence: number;
  ai_analysis: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  handled_by: number;
  handled_at: string;
  handle_result: string;
  created_at: string;
  updated_at: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export interface AIServiceStatus {
  id: number;
  service_name: string;
  instance_id: string;
  status: 'running' | 'idle' | 'error' | 'maintenance';
  current_task: string;
  task_progress: number;
  task_detail: Record<string, unknown>;
  metrics: Record<string, unknown>;
  last_heartbeat: string;
}

// ==================== 管理后台相关 ====================
export interface AdminDashboard {
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  adminUsers: number;
  totalConversations: number;
  singleChats: number;
  groupChats: number;
  totalMessages: number;
  totalMoments: number;
}

export interface SystemNotification {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  priority: 'low' | 'medium' | 'high';
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

// ==================== 设置相关 ====================
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  soundEnabled: boolean;
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowSearch: boolean;
  };
}

// ==================== 朋友圈相关 ====================
export interface Moment {
  id: number;
  user_id: number;
  content: string;
  images: string[];
  likes: number;
  comments: MomentComment[];
  created_at: string;
  updated_at: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  is_liked?: boolean;
}

export interface MomentComment {
  id: number;
  moment_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

// ==================== API响应类型 ====================
export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  limit: number;
}

// ==================== 事件回调类型 ====================
export type MessageEventHandler = (message: PusherMessageEvent) => void;
export type GameMoveHandler = (data: GameMoveEvent) => void;
export type GameSurrenderHandler = (data: GameSurrenderEvent) => void;
export type GameFinishedHandler = (data: GameFinishedEvent) => void;

// ==================== 通用工具类型 ====================
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type StringRecord = Record<string, string>;
export type UnknownRecord = Record<string, unknown>;

// 错误类型（用于catch块）
export interface AppError {
  message: string;
  code?: number | string;
  response?: {
    data: ApiResponse<unknown>;
    status: number;
  };
}
