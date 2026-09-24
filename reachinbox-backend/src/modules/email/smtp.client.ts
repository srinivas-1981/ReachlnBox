import nodemailer from 'nodemailer';
import { config } from '../../config/env';

export const transporter = nodemailer.createTransport({
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

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[SMTP] Connection verified successfully');
    return true;
  } catch (error: any) {
    console.error(`[SMTP] Verification failed: code=${error?.code || 'UNKNOWN'}, message=${error?.message || error}`);
    return false;
  }
}
