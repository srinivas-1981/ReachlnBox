import { User } from '@/types';
import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const authService = {
  async loginWithCredentials(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient<{ success: boolean; message: string; data: { user: User; token: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }
    );

    if (response?.data?.token && typeof window !== 'undefined') {
      try {
        localStorage.setItem('reachinbox_auth_token', response.data.token);
      } catch {}
    }

    return response.data;
  },

  loginWithGoogle(): void {
    const oauthUrl = `${API_BASE_URL}/auth/google`;

    if (typeof window !== 'undefined') {
      window.location.assign(oauthUrl);
    }
  },

  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reachinbox_auth_token');
      }
      await apiClient<void>('/auth/logout', { method: 'POST' });
    } catch {
    } finally {
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient<User>('/auth/me');
      return response;
    } catch {
      return null;
    }
  },

  async updateUserProfile(data: { name?: string; role?: string }): Promise<User> {
    const response = await apiClient<{ success: boolean; data: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },
};
