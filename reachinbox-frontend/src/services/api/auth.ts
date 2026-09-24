import { User } from '@/types';
import { apiClient } from './client';

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:5000/api/v1';
}

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
    const baseUrl = getApiBaseUrl();
    const oauthUrl = `${baseUrl}/auth/google`;

    if (typeof window !== 'undefined') {
      window.location.href = oauthUrl;
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
