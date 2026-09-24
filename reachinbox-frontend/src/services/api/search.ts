/**
 * ReachInbox Email Search Service
 * Delegates full-text queries to backend (Elasticsearch).
 * Searches across recipient email address and subject lines.
 */

import { ScheduledEmail, SentEmail, ApiResponse } from '@/types';
import { apiClient } from './client';

export interface SearchResults {
  scheduled: ScheduledEmail[];
  sent: SentEmail[];
  totalMatches: number;
}

export const emailSearchService = {
  /**
   * Dispatches search query to backend search endpoint.
   */
  async searchEmails(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        scheduled: [],
        sent: [],
        totalMatches: 0,
      };
    }

    try {
      const response = await apiClient<ApiResponse<SearchResults>>('/emails/search', {
        params: { q: query.trim() },
      });
      return response.data || { scheduled: [], sent: [], totalMatches: 0 };
    } catch {
      return {
        scheduled: [],
        sent: [],
        totalMatches: 0,
      };
    }
  },
};
