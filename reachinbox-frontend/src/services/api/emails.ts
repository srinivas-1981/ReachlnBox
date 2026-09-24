/**
 * ReachInbox Email Service
 * Handles scheduled emails, sent emails history, status updates, and metrics.
 */

import { ScheduledEmail, SentEmail, DashboardMetrics, ApiResponse } from '@/types';
import { apiClient } from './client';

export const emailService = {
  /**
   * Retrieves dashboard overview statistics.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient<ApiResponse<DashboardMetrics>>('/emails/metrics');
      return response.data;
    } catch {
      return {
        scheduledEmailsCount: 0,
        sentEmailsCount: 0,
        failedEmailsCount: 0,
        emailsQueuedCount: 0,
      };
    }
  },

  /**
   * Retrieves list of scheduled emails with optional search filtering.
   */
  async getScheduledEmails(search?: string): Promise<ScheduledEmail[]> {
    try {
      const response = await apiClient<ApiResponse<ScheduledEmail[]>>('/emails/scheduled', {
        params: { search },
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves list of sent emails with optional search filtering.
   */
  async getSentEmails(search?: string): Promise<SentEmail[]> {
    try {
      const response = await apiClient<ApiResponse<SentEmail[]>>('/emails/sent', {
        params: { search },
      });
      return response.data || [];
    } catch {
      return [];
    }
  },

  /**
   * Pauses a scheduled email campaign / item.
   */
  async pauseScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/pause`, { method: 'POST' });
    } catch {
      // Ignore or log
    }
  },

  /**
   * Resumes a paused scheduled email.
   */
  async resumeScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/resume`, { method: 'POST' });
    } catch {
      // Ignore or log
    }
  },

  /**
   * Cancels/deletes a scheduled email.
   */
  async deleteScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}`, { method: 'DELETE' });
    } catch {
      // Ignore or log
    }
  },

  /**
   * Retries sending a failed email.
   */
  async retryFailedEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/failed/${id}/retry`, { method: 'POST' });
    } catch {
      // Ignore or log
    }
  },

  /**
   * Retrieves a single email by its unique identifier (scheduled or sent).
   */
  async getEmailById(id: string): Promise<ScheduledEmail | SentEmail | null> {
    try {
      const response = await apiClient<ApiResponse<ScheduledEmail | SentEmail>>(`/emails/${id}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Toggles the starred status of an email in PostgreSQL.
   */
  async toggleStarEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/${id}/star`, { method: 'PATCH' });
    } catch {
      // Ignore or log
    }
  },
};
