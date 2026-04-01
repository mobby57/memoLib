/**
 * Service Auth — communique avec le backend C# /api/auth/*
 */
import { api } from '@/lib/api-client';
import type { LoginRequest, RegisterRequest, AuthResponse } from '@/lib/api-types';

const TOKEN_KEY = 'memolib_token';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', data);
    if (typeof window !== 'undefined' && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    return res;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', data);
    if (typeof window !== 'undefined' && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    return res;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
