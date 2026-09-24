import { Router } from 'express';
import authRoutes from './auth.routes';
import emailRoutes from './email.routes';
import campaignRoutes from './campaign.routes';
import slackRoutes from './slack.routes';

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

export default router;
