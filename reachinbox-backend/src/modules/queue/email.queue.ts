import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../../config/redis';

export interface EmailJobData {
  scheduledEmailId: string;
}

export const EMAIL_QUEUE_NAME = 'email-dispatch-queue';

/**
 * BullMQ Queue for scheduled email dispatch.
 * Backed by Redis connection options.
 */
export const emailQueue = new Queue<EmailJobData, any, string>(EMAIL_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

/**
 * Calculates milliseconds delay from current time until scheduledAt.
 */
export function calculateDelay(scheduledAt?: string | Date | null): number {
  if (!scheduledAt) return 0;
  const targetTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  return Math.max(0, targetTime - now);
}

/**
 * Enqueues a delayed job for a scheduled email.
 */
export async function addEmailJob(
  scheduledEmailId: string,
  scheduledAt?: string | Date | null,
  customDelayMs?: number
) {
  const delay = customDelayMs !== undefined ? customDelayMs : calculateDelay(scheduledAt);

  const job = await emailQueue.add(
    'send-email',
    { scheduledEmailId },
    {
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  return job;
}
