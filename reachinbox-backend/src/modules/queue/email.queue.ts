import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../../config/redis';

export interface EmailJobData {
  scheduledEmailId: string;
}

export const EMAIL_QUEUE_NAME = 'email-dispatch-queue';

export const emailQueue = new Queue<EmailJobData>(EMAIL_QUEUE_NAME, {
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

export function calculateDelay(scheduledAt?: string | Date | null): number {
  if (!scheduledAt) return 0;
  const targetTime = new Date(scheduledAt).getTime();
  const now = Date.now();
  return Math.max(0, targetTime - now);
}

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
