import { SlackConnection, ApiResponse } from '@/types';
import { apiClient } from './client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const slackService = {

  async getSlackStatus(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/status');
      return response.data;
    } catch {
      return { connected: false };
    }
  },

  async connectSlack(): Promise<SlackConnection> {
    const oauthUrl = `${API_BASE_URL}/slack/connect`;

    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/connect', {
        method: 'POST',
      });
      return response.data;
    } catch {
      if (typeof window !== 'undefined') {
        window.location.assign(oauthUrl);
      }
      return {
        connected: false,
      };
    }
  },

  async disconnectSlack(): Promise<SlackConnection> {
    const response = await apiClient<ApiResponse<SlackConnection>>('/slack/disconnect', {
      method: 'POST',
    });
    return response.data;
  },
};
