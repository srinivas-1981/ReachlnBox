import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/parse-leads', (req, res) => campaignController.parseLeads(req, res));
router.post('/schedule', (req, res) => campaignController.scheduleCampaign(req, res));

export default router;
