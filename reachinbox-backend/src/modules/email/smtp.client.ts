import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/env';

let _transporter: Transporter | null = null;

export function getSmtpTransporter(): Transporter {
  if (!_transporter) {
    console.log('[SMTP] Initializing Nodemailer pooled transporter for Ethereal...');
    _transporter = nodemailer.createTransport({
      pool: true,
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
      maxConnections: 2,
      maxMessages: 50,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }
  return _transporter;
}

export const transporter = {
  sendMail: async (options: any) => {
    return getSmtpTransporter().sendMail(options);
  },
  verify: async () => {
    return getSmtpTransporter().verify();
  },
};

export async function verifySmtpConnection(): Promise<boolean> {
  if (config.emailTransport !== 'ethereal') {
    return false;
  }
  try {
    const t = getSmtpTransporter();
    await t.verify();
    console.log('[SMTP] Startup verification: connection verified successfully');
    return true;
  } catch (error: any) {
    console.warn(`[SMTP] Startup verification notice: code=${error?.code || 'UNKNOWN'}, message=${error?.message || error} (Nodemailer will establish connections on demand during sendMail)`);
    return false;
  }
}
