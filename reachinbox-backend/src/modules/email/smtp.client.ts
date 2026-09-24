import dns from 'dns';
import net from 'net';
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

export interface SmtpDiagnosticResult {
  host: string;
  port: number;
  secure: boolean;
  dns: {
    status: 'SUCCESS' | 'FAILED';
    resolvedIp?: string;
    error?: string;
  };
  tcp: {
    status: 'CONNECTED' | 'NOT_CONNECTED';
    elapsedMs: number;
    errorCode?: string;
    errorMessage?: string;
  };
  verify?: {
    status: 'SUCCESS' | 'FAILED';
    errorCode?: string;
    errorMessage?: string;
  };
}

export async function runSmtpDiagnostics(host = config.smtp.host, port = config.smtp.port): Promise<SmtpDiagnosticResult> {
  const result: SmtpDiagnosticResult = {
    host,
    port,
    secure: config.smtp.secure,
    dns: { status: 'FAILED' },
    tcp: { status: 'NOT_CONNECTED', elapsedMs: 0 },
  };

  console.log(`[SMTP DIAGNOSTIC] Starting check for ${host}:${port} (secure=${config.smtp.secure})`);

  try {
    const dnsLookup = await new Promise<string>((resolve, reject) => {
      dns.lookup(host, { family: 4 }, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    result.dns = {
      status: 'SUCCESS',
      resolvedIp: dnsLookup,
    };
    console.log(`[SMTP DIAGNOSTIC] DNS: SUCCESS (Resolved IP: ${dnsLookup})`);
  } catch (dnsErr: any) {
    result.dns = {
      status: 'FAILED',
      error: dnsErr.code || dnsErr.message,
    };
    console.error(`[SMTP DIAGNOSTIC] DNS: FAILED (Code: ${dnsErr.code || 'UNKNOWN'}, Message: ${dnsErr.message})`);
  }

  const start = Date.now();
  try {
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port });
      socket.setTimeout(6000);

      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });

      socket.on('timeout', () => {
        socket.destroy();
        const err: any = new Error('Connection timed out');
        err.code = 'ETIMEDOUT';
        reject(err);
      });

      socket.on('error', (err) => {
        reject(err);
      });
    });

    const elapsed = Date.now() - start;
    result.tcp = {
      status: 'CONNECTED',
      elapsedMs: elapsed,
    };
    console.log(`[SMTP DIAGNOSTIC] TCP: CONNECTED to ${host}:${port} in ${elapsed}ms`);
  } catch (tcpErr: any) {
    const elapsed = Date.now() - start;
    result.tcp = {
      status: 'NOT_CONNECTED',
      elapsedMs: elapsed,
      errorCode: tcpErr.code || 'UNKNOWN',
      errorMessage: tcpErr.message,
    };
    console.error(`[SMTP DIAGNOSTIC] TCP: NOT CONNECTED to ${host}:${port} (Elapsed: ${elapsed}ms, Code: ${tcpErr.code || 'UNKNOWN'}, Message: ${tcpErr.message})`);
  }

  if (result.tcp.status === 'CONNECTED') {
    try {
      await transporter.verify();
      result.verify = { status: 'SUCCESS' };
      console.log(`[SMTP DIAGNOSTIC] Nodemailer Verify: SUCCESS`);
    } catch (vErr: any) {
      result.verify = {
        status: 'FAILED',
        errorCode: vErr.code || 'UNKNOWN',
        errorMessage: vErr.message,
      };
      console.error(`[SMTP DIAGNOSTIC] Nodemailer Verify: FAILED (Code: ${vErr.code || 'UNKNOWN'}, Message: ${vErr.message})`);
    }
  }

  return result;
}

export async function verifySmtpConnection(): Promise<boolean> {
  console.log(`[SMTP] Initializing connection check: host=${config.smtp.host}, port=${config.smtp.port}, secure=${config.smtp.secure}, userExists=${Boolean(config.smtp.user)}`);
  const diag = await runSmtpDiagnostics();
  return diag.tcp.status === 'CONNECTED' && diag.verify?.status === 'SUCCESS';
}
