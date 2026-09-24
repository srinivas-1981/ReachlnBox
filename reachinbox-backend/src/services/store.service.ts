import { pool } from '../config/db';
import { addEmailJob } from '../modules/queue/email.queue';

export interface EmailAttachment {
  name: string;
  size: string;
  url?: string;
  type?: string;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  snippet?: string;
  scheduledAt: string;
  delaySeconds: number;
  hourlyLimit: number;
  status: 'draft' | 'scheduled' | 'active' | 'processing' | 'paused' | 'completed' | 'sent' | 'failed';
  attachments?: EmailAttachment[];
  starred?: boolean;
  highlightNote?: string;
  createdAt: string;
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  snippet?: string;
  sentAt: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
  attachments?: EmailAttachment[];
  starred?: boolean;
  highlightNote?: string;
}

export class StoreService {
  /**
   * Retrieves scheduled emails from PostgreSQL database.
   */
  async getScheduled(search?: string): Promise<ScheduledEmail[]> {
    let query = `
      SELECT 
        id, recipient, subject, body, snippet,
        scheduled_at as "scheduledAt",
        delay_seconds as "delaySeconds",
        hourly_limit as "hourlyLimit",
        status, starred,
        highlight_note as "highlightNote",
        attachments,
        created_at as "createdAt"
      FROM emails
      WHERE status != 'sent'
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      query += ` AND (LOWER(recipient) LIKE $1 OR LOWER(subject) LIKE $1)`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    query += ` ORDER BY scheduled_at ASC`;

    const res = await pool.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      scheduledAt: r.scheduledAt ? new Date(r.scheduledAt).toISOString() : new Date().toISOString(),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Retrieves sent emails from PostgreSQL database.
   */
  async getSent(search?: string): Promise<SentEmail[]> {
    let query = `
      SELECT 
        id, recipient, subject, body, snippet,
        sent_at as "sentAt",
        status, starred,
        highlight_note as "highlightNote",
        error_message as "errorMessage",
        attachments
      FROM emails
      WHERE status = 'sent' OR status = 'failed'
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      query += ` AND (LOWER(recipient) LIKE $1 OR LOWER(subject) LIKE $1)`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }

    query += ` ORDER BY sent_at DESC`;

    const res = await pool.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Retrieves email by ID from PostgreSQL database.
   */
  async getEmailById(id: string): Promise<ScheduledEmail | SentEmail | null> {
    const res = await pool.query(
      `
      SELECT 
        e.id, e.user_id as "userId", e.recipient, e.subject, e.body, e.snippet,
        e.scheduled_at as "scheduledAt",
        e.sent_at as "sentAt",
        e.delay_seconds as "delaySeconds",
        e.hourly_limit as "hourlyLimit",
        e.status, e.starred,
        e.highlight_note as "highlightNote",
        e.error_message as "errorMessage",
        e.attachments,
        e.created_at as "createdAt",
        u.name as "senderName",
        u.email as "senderEmail"
      FROM emails e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
      `,
      [id]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      scheduledAt: r.scheduledAt ? new Date(r.scheduledAt).toISOString() : undefined,
      sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : undefined,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    };
  }

  async pauseScheduled(id: string): Promise<boolean> {
    const res = await pool.query(`UPDATE emails SET status = 'paused' WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async resumeScheduled(id: string): Promise<boolean> {
    const res = await pool.query(`UPDATE emails SET status = 'scheduled' WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async deleteScheduled(id: string): Promise<boolean> {
    const res = await pool.query(`DELETE FROM emails WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async retryFailed(id: string): Promise<boolean> {
    const res = await pool.query(
      `UPDATE emails SET status = 'sent', error_message = NULL, sent_at = NOW() WHERE id = $1`,
      [id]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async toggleStar(id: string): Promise<boolean> {
    const res = await pool.query(`UPDATE emails SET starred = NOT starred WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  async addCampaign(payload: {
    subject: string;
    body: string;
    recipients: string[];
    startTime: string;
    delaySeconds: number;
    hourlyLimit: number;
    status?: 'scheduled' | 'sent';
    attachments?: EmailAttachment[];
  }): Promise<{ id: string; count: number }> {
    const campaignId = `camp_${Date.now()}`;
    const status = payload.status || 'scheduled';
    const isSent = status === 'sent';
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Insert campaign record
      await client.query(
        `
        INSERT INTO campaigns (id, user_id, subject, body, recipients, start_time, delay_seconds, hourly_limit, status)
        VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          campaignId,
          payload.subject,
          payload.body,
          JSON.stringify(payload.recipients),
          payload.startTime,
          payload.delaySeconds,
          payload.hourlyLimit,
          status,
        ]
      );

      const queuedJobs: Array<{ id: string; scheduledAt: string }> = [];
      const baseTime = new Date(payload.startTime).getTime();

      // Insert email items for each recipient
      for (let i = 0; i < payload.recipients.length; i++) {
        const rec = payload.recipients[i];
        const emailId = `${isSent ? 'snt' : 'sch'}_${Date.now()}_${i}`;
        const snippet = payload.body.substring(0, 120);

        if (isSent) {
          await client.query(
            `
            INSERT INTO emails (
              id, user_id, recipient, subject, snippet, body, sent_at, delay_seconds, hourly_limit, status, attachments
            ) VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, NOW(), $6, $7, 'sent', $8)
            `,
            [
              emailId,
              rec,
              payload.subject,
              snippet,
              payload.body,
              payload.delaySeconds,
              payload.hourlyLimit,
              JSON.stringify(payload.attachments || []),
            ]
          );
        } else {
          // Calculate paced delivery time for each recipient
          const emailScheduledEpoch = baseTime + (i * payload.delaySeconds * 1000);
          const emailScheduledAt = new Date(emailScheduledEpoch).toISOString();
          queuedJobs.push({ id: emailId, scheduledAt: emailScheduledAt });

          await client.query(
            `
            INSERT INTO emails (
              id, user_id, recipient, subject, snippet, body, scheduled_at, delay_seconds, hourly_limit, status, attachments
            ) VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9)
            `,
            [
              emailId,
              rec,
              payload.subject,
              snippet,
              payload.body,
              emailScheduledAt,
              payload.delaySeconds,
              payload.hourlyLimit,
              JSON.stringify(payload.attachments || []),
            ]
          );
        }
      }

      await client.query('COMMIT');

      // Enqueue BullMQ delayed jobs after transaction commit
      if (!isSent && queuedJobs.length > 0) {
        for (const jobItem of queuedJobs) {
          try {
            await addEmailJob(jobItem.id, jobItem.scheduledAt);
            console.log(`[Queue] Added BullMQ job for email: ${jobItem.id} scheduled at: ${jobItem.scheduledAt}`);
          } catch (qErr: any) {
            console.error(`[Queue] Failed to add BullMQ job for email ${jobItem.id}:`, qErr?.message || qErr);
          }
        }
      }

      return { id: campaignId, count: payload.recipients.length };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getMetrics() {
    const res = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'sent' AND status != 'failed') as "scheduledEmailsCount",
        COUNT(*) FILTER (WHERE status = 'sent') as "sentEmailsCount",
        COUNT(*) FILTER (WHERE status = 'failed') as "failedEmailsCount",
        COUNT(*) FILTER (WHERE status = 'scheduled') as "emailsQueuedCount"
      FROM emails;
    `);

    const row = res.rows[0];
    return {
      scheduledEmailsCount: parseInt(row.scheduledEmailsCount || '0', 10),
      sentEmailsCount: parseInt(row.sentEmailsCount || '0', 10),
      failedEmailsCount: parseInt(row.failedEmailsCount || '0', 10),
      emailsQueuedCount: parseInt(row.emailsQueuedCount || '0', 10),
    };
  }

  async getSlackStatus() {
    const res = await pool.query(
      `SELECT connected, workspace_name as "workspaceName", channel_name as "channelName", connected_at as "connectedAt" FROM slack_integrations LIMIT 1`
    );
    if (res.rows.length === 0) {
      return {
        connected: false,
        workspaceName: '',
        channelName: '',
        connectedAt: '',
      };
    }
    const row = res.rows[0];
    return {
      connected: row.connected,
      workspaceName: row.workspaceName,
      channelName: row.channelName,
      connectedAt: row.connectedAt ? new Date(row.connectedAt).toISOString() : '',
    };
  }

  async setSlackStatus(connected: boolean) {
    await pool.query(
      `
      INSERT INTO slack_integrations (id, user_id, connected, workspace_name, channel_name, connected_at)
      VALUES ('slk_01', 'usr_reach_01', $1, 'ReachInbox Growth Team', '#email-alerts', NOW())
      ON CONFLICT (id) DO UPDATE SET connected = $1, connected_at = NOW()
      `,
      [connected]
    );
  }

  async upsertUser(user: { id: string; name: string; email: string; avatarUrl?: string; role?: string }) {
    await pool.query(
      `
      INSERT INTO users (id, name, email, avatar_url, role, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      `,
      [user.id, user.name, user.email, user.avatarUrl || null, user.role || 'Growth Lead']
    );
  }

  async getUser(id: string) {
    const res = await pool.query(
      `SELECT id, name, email, avatar_url as "avatarUrl", role FROM users WHERE id = $1 OR email = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async updateUser(id: string, updates: { name?: string; role?: string }) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.name) {
      fields.push(`name = $${idx++}`);
      values.push(updates.name);
    }
    if (updates.role) {
      fields.push(`role = $${idx++}`);
      values.push(updates.role);
    }
    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx} OR email = $${idx}
      RETURNING id, name, email, avatar_url as "avatarUrl", role
    `;

    const res = await pool.query(query, values);
    if (res.rows.length === 0) {
      // If user row not yet found, insert default with updated name
      const insertRes = await pool.query(
        `INSERT INTO users (id, name, email, avatar_url, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET name = $2, role = $5
         RETURNING id, name, email, avatar_url as "avatarUrl", role`,
        [id, updates.name || 'User', 'oliver.brown@domain.io', null, updates.role || 'Growth Lead']
      );
      return insertRes.rows[0];
    }
    return res.rows[0];
  }

  /**
   * Retrieves full email record for worker processing.
   */
  async getEmailForDispatch(id: string) {
    const res = await pool.query(
      `
      SELECT 
        e.id, e.user_id as "userId", e.recipient, e.subject, e.body, e.snippet,
        e.scheduled_at as "scheduledAt",
        e.delay_seconds as "delaySeconds",
        e.hourly_limit as "hourlyLimit",
        e.status, e.attachments,
        u.name as "senderName",
        u.email as "senderEmail"
      FROM emails e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
      `,
      [id]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }

  /**
   * Atomically claims an email for processing.
   * Ensures idempotency: only 1 worker can transition an email from 'scheduled' -> 'processing'.
   */
  async claimEmailForProcessing(id: string) {
    const res = await pool.query(
      `
      UPDATE emails 
      SET status = 'processing', updated_at = NOW() 
      WHERE id = $1 AND status = 'scheduled'
      RETURNING id, user_id as "userId", recipient, subject, body, status, hourly_limit as "hourlyLimit"
      `,
      [id]
    );
    return res.rows[0] || null;
  }

  /**
   * Marks email as successfully sent and records provider message ID.
   */
  async markEmailSent(id: string, providerMessageId: string) {
    const res = await pool.query(
      `
      UPDATE emails 
      SET 
        status = 'sent', 
        sent_at = NOW(), 
        provider_message_id = $2, 
        error_message = NULL,
        updated_at = NOW() 
      WHERE id = $1
      RETURNING id, status, sent_at as "sentAt", provider_message_id as "providerMessageId"
      `,
      [id, providerMessageId]
    );
    return res.rows[0] || null;
  }

  /**
   * Marks email as failed.
   */
  async markEmailFailed(id: string, errorMessage: string) {
    const res = await pool.query(
      `
      UPDATE emails 
      SET 
        status = 'failed', 
        error_message = $2, 
        updated_at = NOW() 
      WHERE id = $1
      RETURNING id, status, error_message as "errorMessage"
      `,
      [id, errorMessage]
    );
    return res.rows[0] || null;
  }

  /**
   * Reverts email to 'scheduled' if rate-limited or deferred.
   */
  async resetEmailToScheduled(id: string) {
    await pool.query(
      `
      UPDATE emails 
      SET status = 'scheduled', updated_at = NOW() 
      WHERE id = $1 AND status = 'processing'
      `,
      [id]
    );
  }
}

export const storeService = new StoreService();
