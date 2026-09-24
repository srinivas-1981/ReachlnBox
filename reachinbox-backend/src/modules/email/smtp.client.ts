import nodemailer from 'nodemailer';
import { config } from '../../config/env';

/**
 * Reusable Nodemailer transporter for Ethereal SMTP delivery.
 * Port 587 uses STARTTLS with secure: false.
 */
export const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Verifies the SMTP transporter connection without exposing credentials.
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ SMTP server is ready to take our messages');
    return true;
  } catch (error: any) {
    console.error('❌ SMTP connection verification failed:', error?.message || 'Unknown SMTP error');
    return false;
  }
}
