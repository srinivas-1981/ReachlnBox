import { Response } from 'express';
import { storeService } from '../services/store.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class CampaignController {
  parseLeads(req: AuthenticatedRequest, res: Response): void {
    const sampleEmails: string[] = [];
    res.json({
      success: true,
      data: {
        fileName: 'lead_list.csv',
        fileSize: 0,
        detectedCount: 0,
        sampleEmails,
      },
    });
  }

  async scheduleCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    const {
      subject,
      body,
      recipients = [],
      status = 'scheduled',
      startTime = new Date().toISOString(),
      delaySeconds = 5,
      hourlyLimit = 50,
      attachments = [],
    } = req.body;

    if (!subject || !body) {
      res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
      return;
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one recipient is required',
      });
      return;
    }

    const userId = req.user?.id || 'usr_mitrajit';

    try {
      const result = await storeService.addCampaign(
        {
          subject,
          body,
          recipients,
          status: status === 'sent' ? 'sent' : 'scheduled',
          startTime,
          delaySeconds: Number(delaySeconds) || 5,
          hourlyLimit: Number(hourlyLimit) || 50,
          attachments,
        },
        userId
      );

      res.json({
        success: true,
        data: {
          id: result.id,
          message: `Campaign scheduled successfully for ${result.count} recipients.`,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const campaignController = new CampaignController();
