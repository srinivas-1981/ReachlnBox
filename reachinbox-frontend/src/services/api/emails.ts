import { ScheduledEmail, SentEmail, DashboardMetrics, ApiResponse } from '@/types';
import { apiClient } from './client';

export const emailService = {

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

  async pauseScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/pause`, { method: 'POST' });
    } catch {

    }
  },

  async resumeScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}/resume`, { method: 'POST' });
    } catch {

    }
  },

  async deleteScheduledEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/scheduled/${id}`, { method: 'DELETE' });
    } catch {

    }
  },

  async retryFailedEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/failed/${id}/retry`, { method: 'POST' });
    } catch {

    }
  },

  async getEmailById(id: string): Promise<ScheduledEmail | SentEmail | null> {
    try {
      const response = await apiClient<ApiResponse<ScheduledEmail | SentEmail>>(`/emails/${id}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  async toggleStarEmail(id: string): Promise<void> {
    try {
      await apiClient<void>(`/emails/${id}/star`, { method: 'PATCH' });
    } catch {

    }
  },
};
