import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobData, addEmailJob } from './email.queue';
import { redisConnectionOptions } from '../../config/redis';
import { storeService } from '../../services/store.service';
import { rateLimiter } from '../limiter/rate.limiter';
import { emailService } from '../email/email.service';
import { slackService } from '../../services/slack.service';
import { config } from '../../config/env';

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { scheduledEmailId } = job.data;
  console.log(`[WORKER] job received: ${job.id}`);
  console.log(`[WORKER] email ID: ${scheduledEmailId}`);

  const email = await storeService.getEmailForDispatch(scheduledEmailId);
  if (!email) {
    console.log(`[WORKER] Email ${scheduledEmailId} not found in database, discarding job.`);
    return;
  }

  if (email.status === 'sent' || email.status === 'failed' || email.status === 'paused') {
    console.log(`[WORKER] Email ${scheduledEmailId} status is '${email.status}', skipping dispatch.`);
    return;
  }

  const userId = email.userId || 'usr_reach_01';
  const hourlyLimit = email.hourlyLimit || 50;

  console.log(`[WORKER] rate limit check: ${scheduledEmailId}`);
  const rateLimitStatus = await rateLimiter.checkRateLimit(userId, hourlyLimit, scheduledEmailId);

  if (!rateLimitStatus.allowed) {
    const delayMs = rateLimitStatus.retryAfterMs || 5000;
    console.log(`[WORKER] Rate limit reached. Rescheduling: ${scheduledEmailId} (next window in ${delayMs}ms)`);

    slackService
      .sendRateLimitNotification(userId, {
        emailId: scheduledEmailId,
        subject: email.subject,
        recipient: email.recipient,
        hourlyLimit,
        retryAfterMs: delayMs,
      })
      .catch((err) => console.warn('[WORKER] Slack notification notice:', err?.message || err));

    await addEmailJob(scheduledEmailId, null, delayMs);
    return;
  }

  const claimed = await storeService.claimEmailForProcessing(scheduledEmailId);
  if (!claimed) {
    console.log(`[WORKER] Email ${scheduledEmailId} could not be claimed (already processing or modified), skipping.`);
    return;
  }
  console.log(`[WORKER] status changed to processing: ${scheduledEmailId}`);

  try {
    const fromAddress = email.senderName
      ? `"${email.senderName}" <${config.smtp.from.replace(/^.*<([^>]+)>.*$/, '$1') || config.smtp.user}>`
      : config.smtp.from;

    console.log(`[WORKER] starting SMTP send: ${scheduledEmailId}`);
    const sendResult = await emailService.sendEmail({
      from: fromAddress,
      replyTo: email.senderEmail || undefined,
      to: email.recipient,
      subject: email.subject,
      text: email.body,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1e293b;">
          <div>${email.body.replace(/\n/g, '<br/>')}</div>
        </div>
      `,
      attachments: Array.isArray(email.attachments) && email.attachments.length > 0
        ? email.attachments.map((att: any) => ({
            filename: att.name || 'attachment',
            content: att.content,
            path: att.url,
          }))
        : undefined,
    });
    console.log(`[WORKER] SMTP send completed: ${scheduledEmailId}`);
    console.log(`[WORKER] provider message ID: ${sendResult.messageId}`);

    console.log(`[WORKER] updating database to sent: ${scheduledEmailId}`);
    const updated = await storeService.markEmailSent(scheduledEmailId, sendResult.messageId);
    if (updated) {
      console.log(`[WORKER] database updated to sent: ${scheduledEmailId}`);
    } else {
      console.warn(`[WORKER] database update returned null for email ${scheduledEmailId}`);
    }
    console.log(`[WORKER] job completed: ${job.id}`);
  } catch (err: any) {
    console.error(`[WORKER] Email failed: ${scheduledEmailId} - ${err?.message || err}`);

    const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts || 3);
    if (isFinalAttempt) {
      console.log(`[WORKER] Final attempt reached. Marking email ${scheduledEmailId} as failed in database.`);
      await storeService.markEmailFailed(scheduledEmailId, err?.message || 'SMTP delivery failure');
    } else {
      console.log(`[WORKER] Resetting email ${scheduledEmailId} status back to scheduled for BullMQ retry.`);
      await storeService.resetEmailToScheduled(scheduledEmailId);
    }

    throw err;
  }
}

export function startEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      await processEmailJob(job);
    },
    {
      connection: redisConnectionOptions,
      concurrency: config.worker.concurrency,
    }
  );

  worker.on('ready', () => {
    console.log(` BullMQ Worker started for '${EMAIL_QUEUE_NAME}' with concurrency: ${config.worker.concurrency}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} (Email: ${job?.data?.scheduledEmailId}) failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] BullMQ Worker error:', err.message);
  });

  return worker;
}
