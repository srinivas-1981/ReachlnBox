import { Request, Response } from 'express';
import { authService, UserPayload } from '../services/auth.service';
import { storeService } from '../services/store.service';
import { config } from '../config/env';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
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

      await storeService.upsertUser(user);

      const token = authService.signToken(user);

      res.cookie('token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(`${config.frontendUrl}/dashboard?token=${encodeURIComponent(token)}`);
    } catch (err) {
      console.error('Failed to exchange Google OAuth code:', err);
      res.redirect(`${config.frontendUrl}/?error=exchange_failed`);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, username, password } = req.body || {};
    const rawIdentifier = ((email || username) as string | undefined)?.trim();

    if (!rawIdentifier || !password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const identifier = rawIdentifier.toLowerCase();

    const matchedUser = config.auth.users.find((u) => {
      const uName = u.name.toLowerCase();
      const uEmail = u.email.toLowerCase();
      return (
        uEmail === identifier ||
        uName === identifier ||
        `${uName}@reachinbox.ai` === identifier ||
        `${uName}@reachinbox.local` === identifier
      );
    });

    if (!matchedUser || password !== matchedUser.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    try {
      const userEmail = matchedUser.email.includes('@')
        ? matchedUser.email
        : `${matchedUser.name.toLowerCase()}@reachinbox.ai`;

      const user: UserPayload = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: userEmail,
        avatarUrl: '',
        role: 'Growth Lead',
      };

      await storeService.upsertUser(user);

      const existingUser = await storeService.getUser(matchedUser.id);
      const finalUser = existingUser || user;

      const token = authService.signToken(finalUser);

      res.cookie('token', token, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: finalUser,
          token,
        },
      });
    } catch (err: any) {
      console.error('Error during login:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to complete login',
      });
    }
  }

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

    res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in.',
    });
  }

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
