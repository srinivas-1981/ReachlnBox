/**
 * ISOLATED DEVELOPMENT / DEMO DATA
 * 
 * NOTE: As per architectural design rules, this file is strictly isolated
 * to provide typed initial fixture data for UI development and testing
 * when the backend API is not actively running.
 * It is easily swappable/removable once connected to the ReachInbox backend.
 */

import {
  User,
  ScheduledEmail,
  SentEmail,
  SlackConnection,
  DashboardMetrics,
} from '@/types';

export const mockUser: User = {
  id: 'usr_reach_01',
  name: 'Oliver Brown',
  email: 'oliver.brown@domain.io',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Growth Lead',
  createdAt: '2026-01-15T08:00:00Z',
};

export const mockDashboardMetrics: DashboardMetrics = {
  scheduledEmailsCount: 11,
  sentEmailsCount: 786,
  failedEmailsCount: 3,
  emailsQueuedCount: 28,
};

export const mockScheduledEmails: ScheduledEmail[] = [
  {
    id: 'sch_01',
    recipient: 'John Smith',
    subject: 'Meeting follow-up',
    scheduledAt: '2026-09-23T08:16:32Z',
    status: 'scheduled',
    starred: false,
    snippet: 'Hi John, just wanted to follow up on our meeting...',
    body: 'Hi John,\n\nJust wanted to follow up on our meeting earlier today. Looking forward to our next steps.\n\nBest,\nOliver',
    delaySeconds: 2,
    hourlyLimit: 200,
  },
  {
    id: 'sch_02',
    recipient: 'Olive',
    subject: "Rohit, great to meet you - you'll love it",
    scheduledAt: '2026-09-24T21:15:12Z',
    status: 'scheduled',
    starred: true,
    snippet: 'Hi Olive, just wanted to follow up on our meeting...',
    body: 'Hi Olive,\n\nRohit, great to meet you - you\'ll love working with our new scheduling cadence.\n\nBest,\nOliver',
    delaySeconds: 2,
    hourlyLimit: 200,
  },
  {
    id: 'sch_03',
    recipient: 'Oliver Brown',
    senderName: 'Amanda Clark',
    senderEmail: 'amanda@domain.com',
    subject: 'Oliver, hello there! | MJWYT44 BM#52W01',
    scheduledAt: '2026-03-03T10:23:00Z',
    status: 'active',
    starred: true,
    snippet: "Hey Oliver, You've just RECEIVED something...",
    body: `Hey Oliver,\n\nYou've just RECEIVED something\n\n★ Extremely Exclusive—Only 4 Spots Worldwide Per Year | $25,000 Investment ★\nTo explore securing your private transformation, simply reply right now with 'FLY OUT FIX' - \n\nYour coach for world-class performance,\nGrant\n\nP.S. Always remember that you can develop world class technique! 🚀`,
    attachments: [
      {
        id: 'att_01',
        name: 'Tennis_Coach_Profile.png',
        size: '1.2 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=120&auto=format&fit=crop&q=80',
      },
      {
        id: 'att_02',
        name: 'Tennis_Coach_Profile2.png',
        size: '1.2 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=120&auto=format&fit=crop&q=80',
      },
    ],
    delaySeconds: 2,
    hourlyLimit: 200,
  },
  {
    id: 'sch_04',
    recipient: 'Sarah Connor',
    subject: 'Follow-up: Q4 Growth Strategy & Cold Outreach Automation',
    scheduledAt: '2026-09-24T14:15:00Z',
    status: 'scheduled',
    starred: false,
    snippet: 'Hi Sarah, wanted to follow up on our previous conversation regarding email automation...',
    body: 'Hi Sarah,\n\nWanted to follow up on our previous conversation regarding email automation and delivery rates.\n\nBest,\nOliver',
    delaySeconds: 5,
    hourlyLimit: 100,
  },
  {
    id: 'sch_05',
    recipient: 'Michael Chen',
    subject: 'ReachInbox Enterprise Scheduling Demo',
    scheduledAt: '2026-09-25T11:00:00Z',
    status: 'paused',
    starred: false,
    snippet: 'Hello Michael, sharing our product demo walkthrough for high-deliverability scheduling...',
    body: 'Hello Michael,\n\nSharing our product demo walkthrough for high-deliverability scheduling.\n\nBest,\nOliver',
    delaySeconds: 3,
    hourlyLimit: 150,
  },
];

export const mockSentEmails: SentEmail[] = [
  {
    id: 'snt_01',
    recipient: 'Sarah Wilson',
    subject: 'Re: Project Update',
    sentAt: '2026-09-22T08:30:00Z',
    status: 'sent',
    starred: false,
    snippet: 'Thanks for the update, Sarah. Looks good!',
    body: 'Hi Sarah,\n\nThanks for the update, Sarah. Looks good! We are ready to proceed with the campaign.\n\nBest,\nOliver',
  },
  {
    id: 'snt_02',
    recipient: 'Support',
    subject: 'Issue with login',
    sentAt: '2026-09-22T08:45:00Z',
    status: 'sent',
    starred: false,
    snippet: 'I am having trouble logging in to the dashboard...',
    body: 'Hello Support Team,\n\nI am having trouble logging in to the dashboard with my second account. Could you please check the OAuth settings?\n\nThanks,\nOliver',
  },
  {
    id: 'snt_03',
    recipient: 'Brian Kelly',
    subject: 'Your invited access to the ReachInbox Beta',
    sentAt: '2026-09-22T09:12:00Z',
    status: 'sent',
    starred: true,
    snippet: 'Welcome to ReachInbox! Your account has been provisioned...',
    body: 'Hi Brian,\n\nWelcome to ReachInbox! Your account has been provisioned with priority access.\n\nBest,\nOliver',
  },
  {
    id: 'snt_04',
    recipient: 'Thomas Edwards',
    subject: 'Quick question about your cold email workflow',
    sentAt: '2026-09-21T16:20:00Z',
    status: 'failed',
    starred: false,
    errorMessage: 'Recipient mailbox unavailable or domain MX record timeout (550)',
    snippet: 'Hi Thomas, following up on our cold outreach workflow notes...',
    body: 'Hi Thomas,\n\nFollowing up on our cold outreach workflow notes.\n\nBest,\nOliver',
  },
];

export const mockSlackConnection: SlackConnection = {
  connected: true,
  workspaceName: 'ReachInbox Growth Team',
  channelName: '#email-alerts',
  connectedAt: '2026-09-10T14:30:00Z',
};
