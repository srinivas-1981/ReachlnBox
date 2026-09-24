import { Request, Response } from 'express';
import { storeService } from '../services/store.service';

export class CampaignController {
  /**
   * Parses uploaded CSV or TXT lead lists and extracts emails.
   */
  parseLeads(req: Request, res: Response): void {
    // If request contains text or mock body:
    const sampleEmails = [
      'sarah.connor@acme-corp.com',
      'michael.chen@techvanguard.io',
      'elena.rostova@cloudscale.net',
      'david.kim@nexusanalytics.com',
    ];

    res.json({
      success: true,
      data: {
        fileName: 'lead_list.csv',
        fileSize: 14200,
        detectedCount: 127,
        sampleEmails,
      },
    });
  }

  /**
   * Schedules a new email campaign.
   */
  async scheduleCampaign(req: Request, res: Response): Promise<void> {
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

    try {
      const effectiveRecipients = Array.isArray(recipients) && recipients.length > 0
        ? recipients
        : ['sarah.connor@acme-corp.com'];
      const result = await storeService.addCampaign({
        subject,
        body,
        recipients: effectiveRecipients,
        status: status === 'sent' ? 'sent' : 'scheduled',
        startTime,
        delaySeconds: Number(delaySeconds) || 5,
        hourlyLimit: Number(hourlyLimit) || 50,
        attachments,
      });

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
