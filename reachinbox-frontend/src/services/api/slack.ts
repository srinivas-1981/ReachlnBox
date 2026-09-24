/* eslint-disable @next/next/no-location-assign-relative-destination */
/**
 * ReachInbox Slack Integration Service
 * Manages Slack OAuth initiation, connection status, and disconnection.
 */

import { SlackConnection, ApiResponse } from '@/types';
import { apiClient } from './client';

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
      return { connected: false };
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
      if (typeof window !== 'undefined') {
        window.location.assign(oauthUrl);
      }
      return {
        connected: false,
      };
    }
  },

  /**
   * Disconnects Slack workspace and deauthorizes webhook alerts.
   */
  async disconnectSlack(): Promise<SlackConnection> {
    const response = await apiClient<ApiResponse<SlackConnection>>('/slack/disconnect', {
      method: 'POST',
    });
    return response.data;
  },
};
