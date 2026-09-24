import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobData, addEmailJob } from './email.queue';
import { redisConnectionOptions } from '../../config/redis';
import { storeService } from '../../services/store.service';
import { rateLimiter } from '../limiter/rate.limiter';
import { emailService } from '../email/email.service';
import { config } from '../../config/env';

/**
 * Worker processor for email dispatch.
 */
export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { scheduledEmailId } = job.data;
  console.log(`[Worker] Processing scheduled email: ${scheduledEmailId}`);

  // 1. Fetch email from PostgreSQL
  const email = await storeService.getEmailForDispatch(scheduledEmailId);
  if (!email) {
    console.log(`[Worker] Email ${scheduledEmailId} not found in database, discarding job.`);
    return;
  }

  // 2. Verify status is still "scheduled"
  if (email.status !== 'scheduled') {
    console.log(`[Worker] Email ${scheduledEmailId} status is '${email.status}', skipping dispatch.`);
    return;
  }

  const userId = email.userId || 'usr_reach_01';
  const hourlyLimit = email.hourlyLimit || 50;

  // 3. Check Redis rolling hourly rate limit
  const rateLimitStatus = await rateLimiter.checkRateLimit(userId, hourlyLimit, scheduledEmailId);

  if (!rateLimitStatus.allowed) {
    const delayMs = rateLimitStatus.retryAfterMs || 5000;
    console.log(`[Worker] Rate limit reached. Rescheduling: ${scheduledEmailId} (next window in ${delayMs}ms)`);
    // Reschedule in BullMQ without consuming retry attempts
    await addEmailJob(scheduledEmailId, null, delayMs);
    return;
  }

  console.log(`[Worker] Rate limit allowed: ${scheduledEmailId}`);

  // 4. Atomically claim email to ensure idempotency & prevent duplicate sends across workers
  const claimed = await storeService.claimEmailForProcessing(scheduledEmailId);
  if (!claimed) {
    console.log(`[Worker] Email ${scheduledEmailId} could not be claimed (already processing or modified), skipping.`);
    return;
  }

  // 5. Send using verified Nodemailer / Ethereal SMTP service
  console.log(`[Worker] Sending email: ${scheduledEmailId}`);
  try {
    const fromAddress = email.senderName
      ? `"${email.senderName}" <${config.smtp.from.replace(/^.*<([^>]+)>.*$/, '$1') || config.smtp.user}>`
      : config.smtp.from;

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

    // 6. On success: update database status to "sent" with messageId
    await storeService.markEmailSent(scheduledEmailId, sendResult.messageId);
    console.log(`[Worker] Email sent successfully: ${scheduledEmailId} (Message ID: ${sendResult.messageId})`);
    if (sendResult.previewUrl) {
      console.log(`[Worker] Preview URL: ${sendResult.previewUrl}`);
    }
  } catch (err: any) {
    console.error(`[Worker] Email failed: ${scheduledEmailId} - ${err?.message || err}`);

    // Check if this is the last BullMQ attempt
    const isFinalAttempt = (job.attemptsMade + 1) >= (job.opts.attempts || 3);
    if (isFinalAttempt) {
      await storeService.markEmailFailed(scheduledEmailId, err?.message || 'SMTP delivery failure');
    } else {
      // Revert status to 'scheduled' so retry attempt can claim it
      await storeService.resetEmailToScheduled(scheduledEmailId);
    }

    // Re-throw error so BullMQ triggers exponential backoff retry
    throw err;
  }
}

/**
 * Initializes and starts the BullMQ Worker.
 */
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
    console.log(`⚙️ BullMQ Worker started for '${EMAIL_QUEUE_NAME}' with concurrency: ${config.worker.concurrency}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} (Email: ${job?.data?.scheduledEmailId}) failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] BullMQ Worker error:', err.message);
  });

  return worker;
}
