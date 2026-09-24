/**
 * ReachInbox Fixtures / Types
 */

import {
  User,
  ScheduledEmail,
  SentEmail,
  SlackConnection,
  DashboardMetrics,
} from '@/types';

export const mockUser: User = {
  id: '',
  name: '',
  email: '',
  avatarUrl: '',
  role: '',
  createdAt: new Date().toISOString(),
};

export const mockDashboardMetrics: DashboardMetrics = {
  scheduledEmailsCount: 0,
  sentEmailsCount: 0,
  failedEmailsCount: 0,
  emailsQueuedCount: 0,
};

export const mockScheduledEmails: ScheduledEmail[] = [];
export const mockSentEmails: SentEmail[] = [];

export const mockSlackConnection: SlackConnection = {
  connected: false,
  workspaceName: '',
  channelName: '',
  connectedAt: '',
};
