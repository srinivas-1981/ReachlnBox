import { Router } from 'express';
import authRoutes from './auth.routes';
import emailRoutes from './email.routes';
import campaignRoutes from './campaign.routes';
import slackRoutes from './slack.routes';
import { runSmtpDiagnostics } from '../modules/email/smtp.client';

const router = Router();

router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/campaigns', campaignRoutes);
router.use('/slack', slackRoutes);

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'reachinbox-backend',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/smtp-diag', async (_req, res) => {
  const diag = await runSmtpDiagnostics();
  res.json({
    status: diag.tcp.status === 'CONNECTED' ? 'ok' : 'degraded',
    service: 'reachinbox-backend',
    diagnostic: diag,
    timestamp: new Date().toISOString(),
  });
});

export default router;
