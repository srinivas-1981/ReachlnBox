import { config } from '../../config/env';
import { EmailDeliveryProvider, SendEmailOptions, DeliveryResult } from './delivery.provider';
import { SimulatedEmailProvider } from './simulated.provider';
import { EtherealEmailProvider } from './ethereal.provider';

export { SendEmailOptions, DeliveryResult, EmailDeliveryProvider } from './delivery.provider';

export class EmailService {
  private provider: EmailDeliveryProvider;

  constructor(customProvider?: EmailDeliveryProvider) {
    if (customProvider) {
      this.provider = customProvider;
    } else {
      this.provider = this.createProviderFromConfig();
    }
  }

  private createProviderFromConfig(): EmailDeliveryProvider {
    if (config.emailTransport === 'ethereal') {
      return new EtherealEmailProvider();
    }
    return new SimulatedEmailProvider();
  }

  public getProvider(): EmailDeliveryProvider {
    return this.provider;
  }

  public setProvider(provider: EmailDeliveryProvider): void {
    this.provider = provider;
  }

  public get transportName(): 'simulated' | 'ethereal' {
    return this.provider.transportName;
  }

  async sendEmail(options: SendEmailOptions): Promise<DeliveryResult> {
    return this.provider.send(options);
  }
}

export const emailService = new EmailService();
