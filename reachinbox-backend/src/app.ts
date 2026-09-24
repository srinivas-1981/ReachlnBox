import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import v1Routes from './routes';

export const app = express();

app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (config.nodeEnv === 'development') {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.use('/api/v1', v1Routes);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'ReachInbox Backend API',
    version: '1.0.0',
    endpoints: {
      googleAuth: `${config.frontendUrl.replace(':3000', ':5000')}/api/v1/auth/google`,
      googleCallback: config.google.redirectUri,
      health: '/api/v1/health',
    },
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});
