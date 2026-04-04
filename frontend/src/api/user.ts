import apiClient from './client';

export interface LoginRequest {
  loginField: string;
  password: string;
}

export interface RegisterRequest {
  password: string;
  nickname: string;
  email: string;
}

export interface UserProfile {
  id: number;
  username: string | null;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'tech_god';
  status: number;
  created_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}

export const userApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/user/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/user/register', data),

  getProfile: () =>
    apiClient.get<UserProfile>('/user/profile'),

  updateProfile: (data: Partial<UserProfile>) =>
    apiClient.put<UserProfile>('/user/profile', data),

  searchUsers: (keyword: string) =>
    apiClient.get<{ id: number; username: string; nickname: string; avatar: string; status: number }[]>('/user/search', { params: { keyword } }),

  logout: () =>
    apiClient.post('/user/logout')
};
