import { Response } from 'express';
import { storeService } from '../services/store.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SlackController {
  async getStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'usr_mitrajit';
      const data = await storeService.getSlackStatus(userId);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async connect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'usr_mitrajit';
      await storeService.setSlackStatus(true, userId);
      res.json({
        success: true,
        message: 'Slack workspace connected successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || 'usr_mitrajit';
      await storeService.setSlackStatus(false, userId);
      res.json({
        success: true,
        message: 'Slack workspace disconnected',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const slackController = new SlackController();
