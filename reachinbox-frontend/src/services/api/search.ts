/**
 * ReachInbox Email Search Service
 * Delegates full-text queries to backend (Elasticsearch).
 * Searches across recipient email address and subject lines.
 */

import { ScheduledEmail, SentEmail, ApiResponse } from '@/types';
import { apiClient } from './client';
import { mockScheduledEmails, mockSentEmails } from '@/lib/mockData';

export interface SearchResults {
  scheduled: ScheduledEmail[];
  sent: SentEmail[];
  totalMatches: number;
}

export const emailSearchService = {
  /**
   * Dispatches search query to backend Elasticsearch endpoint.
   */
  async searchEmails(query: string): Promise<SearchResults> {
    if (!query.trim()) {
      return {
        scheduled: mockScheduledEmails,
        sent: mockSentEmails,
        totalMatches: mockScheduledEmails.length + mockSentEmails.length,
      };
    }

    try {
      const response = await apiClient<ApiResponse<SearchResults>>('/emails/search', {
        params: { q: query.trim() },
      });
      return response.data;
    } catch {
      // Offline fallback: perform filter matching
      const q = query.toLowerCase().trim();
      const matchedScheduled = mockScheduledEmails.filter(
        (e) => e.recipient.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
      );
      const matchedSent = mockSentEmails.filter(
        (e) => e.recipient.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q)
      );

      return {
        scheduled: matchedScheduled,
        sent: matchedSent,
        totalMatches: matchedScheduled.length + matchedSent.length,
      };
    }
  },
};
