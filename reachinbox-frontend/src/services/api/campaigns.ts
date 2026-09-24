import { EmailCampaignPayload, LeadsUploadResult, ApiResponse } from '@/types';
import { apiClient } from './client';

export const campaignService = {

  async uploadLeadsFile(file: File): Promise<LeadsUploadResult> {
    try {
      const text = await file.text();

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const matches = text.match(emailRegex) || [];

      const uniqueEmails: string[] = [];
      const seen = new Set<string>();

      for (const email of matches) {
        const normalized = email.trim().toLowerCase();
        if (!seen.has(normalized)) {
          seen.add(normalized);
          uniqueEmails.push(email.trim());
        }
      }

      return {
        fileName: file.name,
        fileSize: file.size,
        detectedCount: uniqueEmails.length,
        sampleEmails: uniqueEmails,
      };
    } catch {
      return {
        fileName: file.name,
        fileSize: file.size,
        detectedCount: 0,
        sampleEmails: [],
      };
    }
  },

  async scheduleEmailCampaign(payload: EmailCampaignPayload): Promise<{ id: string; message: string }> {
    const response = await apiClient<ApiResponse<{ id: string; message: string }>>('/campaigns/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
