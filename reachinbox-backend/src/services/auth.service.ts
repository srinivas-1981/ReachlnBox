import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { oauth2Client, GOOGLE_OAUTH_SCOPES } from '../config/google';
import { config } from '../config/env';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export class AuthService {

  getGoogleAuthUrl(state?: string): string {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GOOGLE_OAUTH_SCOPES,
      state: state || 'reachinbox-login',
    });
  }

  async exchangeGoogleCode(code: string): Promise<{ user: UserPayload; tokens: any }> {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const userInfo = await oauth2.userinfo.get();
    const data = userInfo.data;

    const user: UserPayload = {
      id: data.id || `google_${Date.now()}`,
      name: data.name || data.email?.split('@')[0] || 'Oliver Brown',
      email: data.email || 'oliver.brown@domain.io',
      avatarUrl: data.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Growth Lead',
    };

    return { user, tokens };
  }

  signToken(user: UserPayload): string {
    return jwt.sign(user, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });
  }

  verifyToken(token: string): UserPayload | null {
    try {
      return jwt.verify(token, config.jwt.secret) as UserPayload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
