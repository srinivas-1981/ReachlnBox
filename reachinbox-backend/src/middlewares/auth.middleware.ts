import { Request, Response, NextFunction } from 'express';
import { authService, UserPayload } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
    token = req.cookies.token || req.cookies.auth_token;
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }
  }

  // If unauthenticated, return 401
  res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in with Google.',
  });
};

export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && (req.cookies.token || req.cookies.auth_token)) {
    token = req.cookies.token || req.cookies.auth_token;
  } else if (typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    const decoded = authService.verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};
