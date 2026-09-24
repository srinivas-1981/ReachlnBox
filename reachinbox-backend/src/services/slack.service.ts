import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { storeService } from './store.service';

export interface SlackOAuthState {
  userId: string;
  purpose: 'slack_oauth';
}

export class SlackService {

  generateOAuthState(userId: string): string {
    const payload: SlackOAuthState = {
      userId,
      purpose: 'slack_oauth',
    };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: '15m' });
  }

  verifyOAuthState(stateToken: string): string | null {
    try {
      const decoded = jwt.verify(stateToken, config.jwt.secret) as SlackOAuthState;
      if (decoded && decoded.purpose === 'slack_oauth' && decoded.userId) {
        return decoded.userId;
      }
      return null;
    } catch {
      return null;
    }
  }

  getOAuthUrl(userId: string): string {
    const state = this.generateOAuthState(userId);
    const params = new URLSearchParams({
      client_id: config.slack.clientId,
      scope: config.slack.scopes,
      redirect_uri: config.slack.redirectUri,
      state,
    });
    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCode(code: string, state: string): Promise<{ userId: string; workspaceName: string; channelName: string }> {
    const userId = this.verifyOAuthState(state);
    if (!userId) {
      throw new Error('Invalid or expired OAuth state parameter');
    }

    if (!config.slack.clientId || !config.slack.clientSecret) {
      throw new Error('Slack OAuth credentials (SLACK_CLIENT_ID, SLACK_CLIENT_SECRET) are not configured');
    }

    const params = new URLSearchParams({
      client_id: config.slack.clientId,
      client_secret: config.slack.clientSecret,
      code,
      redirect_uri: config.slack.redirectUri,
    });

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data: any = await response.json().catch(() => null);

    if (!data || !data.ok) {
      const errorMsg = data?.error || 'Slack OAuth token exchange failed';
      console.error('[SlackService] OAuth exchange error:', errorMsg);
      throw new Error(`Slack OAuth error: ${errorMsg}`);
    }

    const workspaceName = data.team?.name || 'Slack Workspace';
    const workspaceId = data.team?.id || '';
    const channelName = data.incoming_webhook?.channel || '#email-alerts';
    const channelId = data.incoming_webhook?.channel_id || '';
    const accessToken = data.access_token || '';
    const webhookUrl = data.incoming_webhook?.url || '';
    const botUserId = data.bot_user_id || '';

    await storeService.saveSlackIntegration(userId, {
      workspaceName,
      workspaceId,
      channelName,
      channelId,
      accessToken,
      webhookUrl,
      botUserId,
    });

    console.log(`[SlackService] Successfully connected Slack workspace "${workspaceName}" for user: ${userId}`);

    return {
      userId,
      workspaceName,
      channelName,
    };
  }

  async sendRateLimitNotification(
    userId: string,
    alertData: {
      emailId: string;
      subject: string;
      recipient: string;
      hourlyLimit: number;
      retryAfterMs: number;
    }
  ): Promise<boolean> {
    try {
      const integration = await storeService.getSlackIntegration(userId);
      if (!integration || !integration.connected) {

        return false;
      }

      const retrySeconds = Math.max(1, Math.ceil(alertData.retryAfterMs / 1000));
      const textMessage = ` *ReachInbox Rate Limit Alert*\n` +
        `• *Recipient:* \`${alertData.recipient}\`\n` +
        `• *Subject:* "${alertData.subject || '(No Subject)'}"\n` +
        `• *Hourly Limit:* ${alertData.hourlyLimit} emails/hour\n` +
        `• *Status:* Throttled. Delivery deferred for ${retrySeconds}s until the next sending window.`;

      if (integration.webhookUrl) {
        const res = await fetch(integration.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: textMessage,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: ' ReachInbox Hourly Rate Limit Reached',
                  emoji: true,
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Recipient:*\n\`${alertData.recipient}\``,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Hourly Limit:*\n${alertData.hourlyLimit} emails/hr`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Subject:*\n${alertData.subject || '(No Subject)'}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Reschedule Delay:*\n${retrySeconds} seconds`,
                  },
                ],
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Email \`${alertData.emailId}\` queued for next available dispatch window.`,
                  },
                ],
              },
            ],
          }),
        });

        if (res.ok) {
          console.log(`[SlackService] Rate-limit alert posted via webhook for user: ${userId}`);
          return true;
        }
      }

      if (integration.accessToken) {
        const targetChannel = integration.channelId || integration.channelName || '#general';
        const res = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${integration.accessToken}`,
          },
          body: JSON.stringify({
            channel: targetChannel,
            text: textMessage,
          }),
        });

        const json: any = await res.json().catch(() => null);
        if (json && json.ok) {
          console.log(`[SlackService] Rate-limit alert posted via Web API for user: ${userId}`);
          return true;
        } else {
          console.warn(`[SlackService] Web API postMessage returned error: ${json?.error || 'Unknown error'}`);
        }
      }

      return false;
    } catch (err: any) {

      console.warn(`[SlackService] Failed to send Slack notification for user ${userId}:`, err?.message || err);
      return false;
    }
  }
}

export const slackService = new SlackService();
