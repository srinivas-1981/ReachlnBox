import { Request, Response } from 'express';
import { storeService } from '../services/store.service';

export class SlackController {
  async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const data = await storeService.getSlackStatus();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async connect(_req: Request, res: Response): Promise<void> {
    try {
      await storeService.setSlackStatus(true);
      res.json({
        success: true,
        message: 'Slack workspace connected successfully',
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async disconnect(_req: Request, res: Response): Promise<void> {
    try {
      await storeService.setSlackStatus(false);
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
