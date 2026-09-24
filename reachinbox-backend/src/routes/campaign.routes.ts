import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';

const router = Router();

router.post('/parse-leads', (req, res) => campaignController.parseLeads(req, res));
router.post('/schedule', (req, res) => campaignController.scheduleCampaign(req, res));

export default router;
