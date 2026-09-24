import { Request, Response } from 'express';
import { storeService } from '../services/store.service';

export class EmailController {
  async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const data = await storeService.getMetrics();
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getScheduled(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const data = await storeService.getScheduled(search);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSent(req: Request, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const data = await storeService.getSent(search);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const email = await storeService.getEmailById(id);
      if (!email) {
        res.status(404).json({
          success: false,
          message: 'Email not found',
        });
        return;
      }
      res.json({
        success: true,
        data: email,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async pauseScheduled(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await storeService.pauseScheduled(id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email paused' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async resumeScheduled(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await storeService.resumeScheduled(id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email resumed' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteScheduled(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await storeService.deleteScheduled(id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async retryFailed(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await storeService.retryFailed(id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Failed email not found' });
        return;
      }
      res.json({ success: true, message: 'Failed email requeued' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleStar(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const success = await storeService.toggleStar(id);
      if (!success) {
        res.status(404).json({ success: false, message: 'Email not found' });
        return;
      }
      res.json({ success: true, message: 'Starred state toggled' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const emailController = new EmailController();
