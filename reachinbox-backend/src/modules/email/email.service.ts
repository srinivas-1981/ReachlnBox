import nodemailer from 'nodemailer';
import { transporter } from './smtp.client';
import { config } from '../../config/env';

export interface SendEmailOptions {
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

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
  response: string;
  accepted: string[];
  rejected: string[];
}

export class EmailService {
  /**
   * Dispatches email via Nodemailer transporter.
   * Free of queue logic or rate-limiting logic.
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const mailOptions = {
      from: config.smtp.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    return {
      messageId: info.messageId,
      previewUrl,
      response: info.response || '',
      accepted: (info.accepted || []) as string[],
      rejected: (info.rejected || []) as string[],
    };
  }
}

export const emailService = new EmailService();
