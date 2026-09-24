import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/reachinbox',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'reachinbox_jwt_default_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'ReachInbox <noreply@reachinbox.ai>',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },

  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
  },

  slack: {
    clientId: process.env.SLACK_CLIENT_ID || '',
    clientSecret: process.env.SLACK_CLIENT_SECRET || '',
    redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/v1/slack/callback',
    scopes: process.env.SLACK_SCOPES || 'chat:write,incoming-webhook,channels:read',
  },

  auth: {
    users: [
      {
        id: 'usr_mitrajit',
        name: 'Mitrajit',
        email: (process.env.MITRAJIT_EMAIL || 'Mitrajit').trim().toLowerCase(),
        password: process.env.MITRAJIT_PASSWORD || 'Yadav036',
      },
      {
        id: 'usr_yadav036',
        name: 'Yadav036',
        email: (process.env.YADAV036_EMAIL || 'Yadav036').trim().toLowerCase(),
        password: process.env.YADAV036_PASSWORD || 'Yadav036',
      },
    ],
  },
};
