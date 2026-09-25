import nodemailer from 'nodemailer';
import { transporter } from './smtp.client';
import { config } from '../../config/env';
import { EmailDeliveryProvider, SendEmailOptions, DeliveryResult } from './delivery.provider';

export class EtherealEmailProvider implements EmailDeliveryProvider {
  readonly transportName = 'ethereal' as const;

  async send(options: SendEmailOptions): Promise<DeliveryResult> {
    const mailOptions = {
      from: options.from || config.smtp.from,
      replyTo: options.replyTo,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    };

    const start = Date.now();
    console.log('[SMTP] sendMail start');
    try {
      const info = await transporter.sendMail(mailOptions);
      const elapsedMs = Date.now() - start;
      console.log(`[SMTP] sendMail completed: elapsedMs=${elapsedMs}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      const providerMessageId = info.messageId || `msg_${Date.now()}`;

      return {
        messageId: providerMessageId,
        providerMessageId,
        sentAt: new Date(),
        status: 'sent',
        previewUrl,
        response: info.response || '',
        accepted: (info.accepted || []) as string[],
        rejected: (info.rejected || []) as string[],
        transport: 'ethereal',
      };
    } catch (err: any) {
      const elapsedMs = Date.now() - start;
      console.error(`[SMTP] sendMail failed: elapsedMs=${elapsedMs}, code=${err?.code || 'UNKNOWN'}, message=${err?.message || err}`);
      throw err;
    }
  }
}
