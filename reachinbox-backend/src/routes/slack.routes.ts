import { Router } from 'express';
import { slackController } from '../controllers/slack.controller';

const router = Router();

router.get('/status', (req, res) => slackController.getStatus(req, res));
router.get('/connect', (req, res) => slackController.connect(req, res));
router.post('/disconnect', (req, res) => slackController.disconnect(req, res));

export default router;
