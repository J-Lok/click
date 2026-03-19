import { api } from './client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupSimpleRequest {
  username: string;
  password: string;
  name: string;
  phone: string;
  email?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export const authApi = {
  login: (data: LoginRequest) => api.post<TokenResponse>('/auth/login', data),
  signupSimple: (data: SignupSimpleRequest) =>
    api.post<TokenResponse>('/auth/signup-simple', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/users/me'),
};
