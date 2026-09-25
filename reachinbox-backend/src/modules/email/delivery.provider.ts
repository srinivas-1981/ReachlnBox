export interface SendEmailOptions {
  from?: string;
  replyTo?: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
}

export interface DeliveryResult {
  messageId: string;
  providerMessageId: string;
  sentAt: Date;
  status: 'sent';
  previewUrl?: string | false;
  response?: string;
  accepted?: string[];
  rejected?: string[];
  transport: 'simulated' | 'ethereal';
}

export interface EmailDeliveryProvider {
  readonly transportName: 'simulated' | 'ethereal';
  send(options: SendEmailOptions): Promise<DeliveryResult>;
}
