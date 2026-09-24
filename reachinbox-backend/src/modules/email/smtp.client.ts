import nodemailer from 'nodemailer';
import { config } from '../../config/env';

export const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log(' SMTP server is ready to take our messages');
    return true;
  } catch (error: any) {
    console.error(' SMTP connection verification failed:', error?.message || 'Unknown SMTP error');
    return false;
  }
}
