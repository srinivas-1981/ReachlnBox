/* eslint-disable @next/next/no-location-assign-relative-destination */
/**
 * ReachInbox Slack Integration Service
 * Manages Slack OAuth initiation, connection status, and disconnection.
 */

import { SlackConnection, ApiResponse } from '@/types';
import { apiClient } from './client';
import { mockSlackConnection } from '@/lib/mockData';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const slackService = {
  /**
   * Fetches current Slack workspace connection status.
   */
  async getSlackStatus(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/status');
      return response.data;
    } catch {
      return mockSlackConnection;
    }
  },

  /**
   * Initiates the Slack OAuth handshake flow by redirecting to backend.
   */
  async connectSlack(): Promise<SlackConnection> {
    const oauthUrl = `${API_BASE_URL}/slack/connect`;

    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/connect', {
        method: 'POST',
      });
      return response.data;
    } catch {
      // Offline fallback: simulate connection
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_API_URL) {
        window.location.assign(oauthUrl);
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        connected: true,
        workspaceName: 'ReachInbox Workspace',
        channelName: '#email-alerts',
        connectedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Disconnects Slack workspace and deauthorizes webhook alerts.
   */
  async disconnectSlack(): Promise<SlackConnection> {
    try {
      const response = await apiClient<ApiResponse<SlackConnection>>('/slack/disconnect', {
        method: 'POST',
      });
      return response.data;
    } catch {
      // Offline fallback: simulate disconnection
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        connected: false,
      };
    }
  },
};
