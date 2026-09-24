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
  console.log(`[SMTP] Initializing connection check: host=${config.smtp.host}, port=${config.smtp.port}, secure=${config.smtp.secure}, userExists=${Boolean(config.smtp.user)}`);
  try {
    await transporter.verify();
    console.log(`[SMTP] Verification SUCCESS: ${config.smtp.host}:${config.smtp.port} is ready`);
    return true;
  } catch (error: any) {
    console.error(`[SMTP] Verification FAILED: host=${config.smtp.host}, port=${config.smtp.port}, secure=${config.smtp.secure}, userExists=${Boolean(config.smtp.user)}, code=${error?.code || 'UNKNOWN'}, message=${error?.message || error}`);
    return false;
  }
}
