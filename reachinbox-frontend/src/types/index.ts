export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role?: string;
  createdAt?: string;
}

export type EmailStatus = 'draft' | 'scheduled' | 'active' | 'processing' | 'paused' | 'completed' | 'sent' | 'failed';

export interface EmailAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  thumbnailUrl?: string;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  scheduledAt: string;
  status: EmailStatus;
  body?: string;
  snippet?: string;
  starred?: boolean;
  senderName?: string;
  senderEmail?: string;
  attachments?: EmailAttachment[];
  campaignId?: string;
  delaySeconds?: number;
  hourlyLimit?: number;
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed';
  body?: string;
  snippet?: string;
  starred?: boolean;
  senderName?: string;
  senderEmail?: string;
  attachments?: EmailAttachment[];
  errorMessage?: string;
  campaignId?: string;
}

export interface EmailLead {
  email: string;
  name?: string;
  company?: string;
  isValid?: boolean;
}

export interface LeadsUploadResult {
  fileName: string;
  fileSize: number;
  detectedCount: number;
  sampleEmails: string[];
}

export interface ScheduleConfiguration {
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
}

export interface EmailCampaignPayload {
  subject: string;
  body: string;
  recipients?: string[];
  status?: 'scheduled' | 'sent';
  leadsFile?: File | null;
  detectedLeadsCount: number;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  attachments?: Array<{ name: string; size: string; previewUrl?: string }>;
}

export interface EmailCampaign {
  id: string;
  subject: string;
  body: string;
  totalLeads: number;
  startTime: string;
  delaySeconds: number;
  hourlyLimit: number;
  status: 'scheduled' | 'running' | 'completed' | 'paused';
  createdAt: string;
}

export interface SlackConnection {
  connected: boolean;
  workspaceName?: string;
  channelName?: string;
  connectedAt?: string;
}

export interface DashboardMetrics {
  scheduledEmailsCount: number;
  sentEmailsCount: number;
  failedEmailsCount: number;
  emailsQueuedCount: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: Pagination;
}

export interface EmailSearchFilters {
  query?: string;
  status?: EmailStatus | 'all';
  type?: 'scheduled' | 'sent' | 'all';
}
