import { Response } from 'express';
import { storeService } from '../services/store.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class EmailController {
  async getMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const data = await storeService.getMetrics(userId);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getScheduled(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const userId = req.user?.id;
      const data = await storeService.getScheduled(search, userId);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getSent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const userId = req.user?.id;
      const data = await storeService.getSent(search, userId);
      res.json({
        success: true,
        data,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const email = await storeService.getEmailById(id, userId);
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

  async pauseScheduled(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const success = await storeService.pauseScheduled(id, userId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email paused' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async resumeScheduled(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const success = await storeService.resumeScheduled(id, userId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email resumed' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async deleteScheduled(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const success = await storeService.deleteScheduled(id, userId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Scheduled email not found' });
        return;
      }
      res.json({ success: true, message: 'Scheduled email deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async retryFailed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const success = await storeService.retryFailed(id, userId);
      if (!success) {
        res.status(404).json({ success: false, message: 'Failed email not found' });
        return;
      }
      res.json({ success: true, message: 'Failed email requeued' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async toggleStar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const success = await storeService.toggleStar(id, userId);
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
