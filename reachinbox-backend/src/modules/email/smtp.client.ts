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
    console.log('[SMTP] Startup verification: connection verified successfully');
    return true;
  } catch (error: any) {
    console.warn(`[SMTP] Startup verification notice: code=${error?.code || 'UNKNOWN'}, message=${error?.message || error} (Nodemailer will establish connections on demand during sendMail)`);
    return false;
  }
}
