export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  status: number;
  created_at: string;
}

export interface Conversation {
  id: number;
  type: 'single' | 'group';
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

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  type: 'text' | 'image' | 'file' | 'system';
  content: string;
  created_at: string;
  username?: string;
  nickname?: string;
  avatar?: string;
}

export interface Contact {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  status: number;
  added_at: string;
}

export interface ApiResponse<T> {
  code: number;
  data: T;
  msg: string;
}
