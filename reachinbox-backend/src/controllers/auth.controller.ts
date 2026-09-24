import { Request, Response } from 'express';
import { authService, UserPayload } from '../services/auth.service';
import { storeService } from '../services/store.service';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  /**
   * Initiates Google OAuth flow by redirecting to Google's consent screen.
   */
  initiateGoogleAuth(req: Request, res: Response): void {
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;
    const authUrl = authService.getGoogleAuthUrl(state);

    if (req.query.format === 'json') {
      res.json({
        success: true,
        url: authUrl,
      });
      return;
    }

    res.redirect(authUrl);
  }

  /**
   * Handles Google OAuth callback after user approves permissions.
   * Matches configured redirect_uri: http://localhost:5000/api/v1/auth/google/callback
   */
  async handleGoogleCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string | undefined;
    const error = req.query.error as string | undefined;

    if (error || !code) {
      console.error('Google OAuth callback error or code missing:', error);
      res.redirect(`${config.frontendUrl}/?error=google_auth_failed`);
      return;
    }

    try {
      const { user } = await authService.exchangeGoogleCode(code);

      // Persist user in PostgreSQL
      await storeService.upsertUser(user);

      const token = authService.signToken(user);

      // Set cookie for browser session
      res.cookie('token', token, {
        httpOnly: false,
        secure: false, // localhost dev
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to frontend dashboard with token in query param
      res.redirect(`${config.frontendUrl}/dashboard?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error('Failed to exchange Google OAuth code:', err);
      res.redirect(`${config.frontendUrl}/?error=exchange_failed`);
    }
  }

  /**
   * Returns current authenticated user profile.
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (req.user) {
      try {
        const dbUser = await storeService.getUser(req.user.id);
        if (dbUser) {
          res.json(dbUser);
          return;
        }
      } catch (err) {
        console.warn('Could not retrieve user from database, returning JWT payload:', err);
      }
      res.json(req.user);
      return;
    }

    // Default development profile - fetch from PostgreSQL
    try {
      const dbUser = await storeService.getUser('usr_reach_01');
      if (dbUser) {
        res.json(dbUser);
        return;
      }
    } catch (err) {
      console.warn('Could not query default user from database:', err);
    }

    const defaultUser: UserPayload = {
      id: 'usr_reach_01',
      name: 'Oliver Brown',
      email: 'oliver.brown@domain.io',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Growth Lead',
    };

    res.json(defaultUser);
  }

  /**
   * Updates user profile (name, role) in PostgreSQL.
   */
  async updateMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.id || 'usr_reach_01';
    const { name, role } = req.body;

    if (!name && !role) {
      res.status(400).json({ success: false, message: 'Name or role is required' });
      return;
    }

    try {
      const updated = await storeService.updateUser(userId, { name, role });
      res.json({ success: true, data: updated });
    } catch (err: any) {
      console.error('Error updating user:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Logs user out and invalidates session cookie.
   */
  logout(_req: Request, res: Response): void {
    res.clearCookie('token');
    res.clearCookie('auth_token');
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

export const authController = new AuthController();
