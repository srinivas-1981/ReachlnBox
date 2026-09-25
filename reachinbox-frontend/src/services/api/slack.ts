import { SlackConnection, ApiResponse } from '@/types';
import { apiClient } from './client';

export const slackService = {
  async getSlackStatus(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/status');
      return response.data || { connected: false };
    } catch {
      return { connected: false };
    }
  },

  async connectSlack(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/connect', {
        method: 'POST',
      });
      return (
        response.data || {
          connected: true,
          workspaceName: 'ReachInbox Growth Team',
          channelName: '#email-alerts',
          connectedAt: new Date().toISOString(),
        }
      );
    } catch {
      return {
        connected: false,
      };
    }
  },

  async disconnectSlack(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/disconnect', {
        method: 'POST',
      });
      return (
        response.data || {
          connected: false,
          workspaceName: '',
          channelName: '',
          connectedAt: '',
        }
      );
    } catch {
      return {
        connected: false,
      };
    }
  },
};
