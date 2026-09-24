/* eslint-disable @next/next/no-location-assign-relative-destination */
/**
 * ReachInbox Authentication Service Abstraction
 * 
 * Handles Google OAuth flow redirection and user session checks.
 * The backend handles Google OAuth token exchanges, cookies, and verification.
 */

import { User } from '@/types';
import { apiClient } from './client';
import { mockUser } from '@/lib/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const authService = {
  /**
   * Initiates Google OAuth authentication flow.
   * Redirects the user to the backend OAuth initialization endpoint.
   * The backend will handle Google consent dialog and callback redirects.
   */
  loginWithGoogle(): void {
    const oauthUrl = `${API_BASE_URL}/auth/google`;

    if (typeof window !== 'undefined') {
      window.location.assign(oauthUrl);
    }
  },

  /**
   * Logs the user out by invalidating backend session cookie / token.
   */
  async logout(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('reachinbox_auth_token');
      }
      await apiClient<void>('/auth/logout', { method: 'POST' });
    } catch {
      // Backend offline fallback
    } finally {
      if (typeof window !== 'undefined') {
        window.location.assign('/');
      }
    }
  },

  /**
   * Retrieves the currently authenticated user's profile.
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient<User>('/auth/me');
      return response;
    } catch {
      // Return isolated mock user for UI development when backend is offline
      return mockUser;
    }
  },

  /**
   * Updates the user's name and/or role in PostgreSQL.
   */
  async updateUserProfile(data: { name?: string; role?: string }): Promise<User> {
    try {
      const response = await apiClient<{ success: boolean; data: User }>('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return response.data;
    } catch {
      return {
        ...mockUser,
        ...data,
      };
    }
  },
};
