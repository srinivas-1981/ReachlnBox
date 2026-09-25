import crypto from 'crypto';
import { EmailDeliveryProvider, SendEmailOptions, DeliveryResult } from './delivery.provider';

export class SimulatedEmailProvider implements EmailDeliveryProvider {
  readonly transportName = 'simulated' as const;

  async send(options: SendEmailOptions): Promise<DeliveryResult> {
    if (!options.to || typeof options.to !== 'string' || !options.to.trim()) {
      throw new Error('Recipient email address (to) is required.');
    }

    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const providerMessageId = `SIMULATED_${Date.now()}_${uniqueSuffix}`;

    return {
      messageId: providerMessageId,
      providerMessageId,
      sentAt: new Date(),
      status: 'sent',
      previewUrl: false,
      response: '250 2.0.0 OK: Simulated delivery completed without SMTP network call',
      accepted: [options.to],
      rejected: [],
      transport: 'simulated',
    };
  }
}
