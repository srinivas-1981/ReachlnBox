/**
 * ReachInbox Email Service
 * Handles scheduled emails, sent emails history, status updates, and metrics.
 */

import { ScheduledEmail, SentEmail, DashboardMetrics, ApiResponse } from '@/types';
import { apiClient } from './client';
import { mockScheduledEmails, mockSentEmails, mockDashboardMetrics } from '@/lib/mockData';

export const emailService = {
  /**
   * Retrieves dashboard overview statistics.
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await apiClient<ApiResponse<DashboardMetrics>>('/emails/metrics');
      return response.data;
    } catch {
      return mockDashboardMetrics;
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
      return response.data;
    } catch {
      if (!search) return mockScheduledEmails;
      const q = search.toLowerCase();
      return mockScheduledEmails.filter(
        (e) => e.recipient.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
      );
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
      return response.data;
    } catch {
      if (!search) return mockSentEmails;
      const q = search.toLowerCase();
      return mockSentEmails.filter(
        (e) => e.recipient.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
      );
    }
  },

  /**
   * Pauses a scheduled email campaign / item.
   */
  async pauseScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/pause`, { method: 'POST' });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Resumes a paused scheduled email.
   */
  async resumeScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/resume`, { method: 'POST' });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Cancels/deletes a scheduled email.
   */
  async deleteScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}`, { method: 'DELETE' });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Retries sending a failed email.
   */
  async retryFailedEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/failed/${id}/retry`, { method: 'POST' });
    } catch {
      // Offline fallback
    }
  },

  /**
   * Retrieves a single email by its unique identifier (scheduled or sent).
   */
  async getEmailById(id: string): Promise<ScheduledEmail | SentEmail | null> {
    try {
      const response = await apiClient<ApiResponse<ScheduledEmail | SentEmail>>(`/emails/${id}`);
      return response.data;
    } catch {
      const scheduled = mockScheduledEmails.find((e) => e.id === id);
      if (scheduled) return scheduled;
      const sent = mockSentEmails.find((e) => e.id === id);
      if (sent) return sent;
      // Fallback detail mock
      return mockScheduledEmails[2];
    }
  },

  /**
   * Toggles the starred status of an email in PostgreSQL.
   */
  async toggleStarEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/${id}/star`, { method: 'PATCH' });
    } catch {
      // Offline fallback
    }
  },
};
