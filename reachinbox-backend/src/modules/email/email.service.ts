import nodemailer from 'nodemailer';
import { transporter } from './smtp.client';
import { config } from '../../config/env';

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

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
  response: string;
  accepted: string[];
  rejected: string[];
}

export class EmailService {

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const mailOptions = {
      from: options.from || config.smtp.from,
      replyTo: options.replyTo,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);

      return {
        messageId: info.messageId || `msg_${Date.now()}`,
        previewUrl,
        response: info.response || '',
        accepted: (info.accepted || []) as string[],
        rejected: (info.rejected || []) as string[],
      };
    } catch (err: any) {
      console.error(`[SMTP] sendMail ERROR: host=${config.smtp.host}, port=${config.smtp.port}, secure=${config.smtp.secure}, userExists=${Boolean(config.smtp.user)}, code=${err?.code || 'UNKNOWN'}, message=${err?.message || err}`);
      throw err;
    }
  }
}

export const emailService = new EmailService();
