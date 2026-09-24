import { initDb, pool } from '../config/db';
import { redisClient } from '../config/redis';
import { addEmailJob, emailQueue } from '../modules/queue/email.queue';
import { startEmailWorker } from '../modules/queue/email.worker';
import { rateLimiter } from '../modules/limiter/rate.limiter';
import { verifySmtpConnection } from '../modules/email/smtp.client';

interface RateLimitedEmailSample {
  id: string;
  recipient: string;
  originalScheduledAt: string;
  bullmqState: string;
  bullmqDelay: number;
  attemptsMade: number;
  finalStatus?: string;
  sentAt?: string;
  providerMessageId?: string;
}

async function run100RecipientTest() {
  console.log('========================================================================');
  console.log(' ReachInbox 100-Recipient Rate-Limiting & Rescheduling Stress Test');
  console.log('========================================================================\n');

  await initDb();
  const smtpReady = await verifySmtpConnection();
  if (!smtpReady) {
    console.error(' SMTP not ready. Aborting test.');
    process.exit(1);
  }
  console.log(' SMTP Connection (Ethereal) verified.');

  const userId = 'usr_reach_01';
  const rateLimitKey = `ratelimit:user:${userId}:hourly`;
  const hourlyLimit = 10;
  const totalRecipients = 100;
  const delaySeconds = 2;

  await rateLimiter.resetUserLimit(userId);
  await emailQueue.drain();
  await emailQueue.clean(0, 1000, 'delayed');
  await emailQueue.clean(0, 1000, 'wait');
  console.log(` Cleaned up Redis rate-limit key and BullMQ queue.\n`);

  const campaignId = `camp_100_test_${Date.now()}`;
  const baseTime = Date.now();
  const emailRecords: Array<{ id: string; recipient: string; scheduledAt: string }> = [];

  console.log(`1 Creating campaign '${campaignId}' with ${totalRecipients} recipients (hourlyLimit = ${hourlyLimit})...`);

  for (let i = 0; i < totalRecipients; i++) {
    const padNum = String(i + 1).padStart(3, '0');
    const recipient = `testuser${padNum}@example.com`;
    const emailId = `sch_100t_${baseTime}_${i + 1}`;
    const scheduledEpoch = baseTime + (i * delaySeconds * 1000);
    const scheduledAt = new Date(scheduledEpoch).toISOString();

    emailRecords.push({ id: emailId, recipient, scheduledAt });

    await pool.query(
      `
      INSERT INTO emails (
        id, user_id, recipient, subject, snippet, body, scheduled_at, delay_seconds, hourly_limit, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
      `,
      [
        emailId,
        userId,
        recipient,
        `Campaign 100 Test - Lead #${i + 1}`,
        `Testing 100 recipient rate limiting for lead #${i + 1}`,
        `Hello ${recipient},\n\nThis is a rate-limit rescheduling test email #${i + 1} from ReachInbox.`,
        scheduledAt,
        delaySeconds,
        hourlyLimit,
      ]
    );

    await addEmailJob(emailId, scheduledAt);
  }

  console.log(` Inserted ${totalRecipients} email records into PostgreSQL and enqueued in BullMQ.\n`);

  console.log('2 Starting BullMQ Worker...');
  const worker = startEmailWorker();
  await worker.waitUntilReady();
  console.log(` BullMQ Worker listening on 'email-dispatch-queue' with concurrency 5.\n`);

  console.log('3 Processing Batch 1 (Emails 1-10) and verifying Rate-Limiting on remaining emails...');
  const waitStart = Date.now();
  while (Date.now() - waitStart < 30000) {
    await new Promise((r) => setTimeout(r, 2000));
    const sentCountRes = await pool.query(
      `SELECT COUNT(*) FROM emails WHERE id LIKE 'sch_100t_${baseTime}_%' AND status = 'sent'`
    );
    const sentCount = parseInt(sentCountRes.rows[0].count, 10);
    const redisCount = await redisClient.zcard(rateLimitKey);
    console.log(` [${Math.round((Date.now() - waitStart) / 1000)}s] Sent: ${sentCount}/${totalRecipients} | Redis Rate Limit: ${redisCount}/${hourlyLimit}`);

    if (sentCount >= 10 && redisCount >= 10) {
      break;
    }
  }

  console.log('\n4 Inspecting BullMQ Queue and Rate-Limited Jobs:');
  const delayedJobs = await emailQueue.getDelayed();
  const waitingJobs = await emailQueue.getWaiting();
  const activeJobs = await emailQueue.getActive();

  console.log(`   - Delayed Jobs in BullMQ: ${delayedJobs.length}`);
  console.log(`   - Waiting Jobs in BullMQ: ${waitingJobs.length}`);
  console.log(`   - Active Jobs in BullMQ:  ${activeJobs.length}`);

  const rateLimitedSamples: RateLimitedEmailSample[] = [];
  const sampleIndices = [10, 11, 12, 13, 14];

  for (const idx of sampleIndices) {
    const item = emailRecords[idx];
    const job = delayedJobs.find((j) => j.data.scheduledEmailId === item.id);
    rateLimitedSamples.push({
      id: item.id,
      recipient: item.recipient,
      originalScheduledAt: item.scheduledAt,
      bullmqState: job ? 'delayed' : 'unknown',
      bullmqDelay: job ? job.opts.delay || 0 : 0,
      attemptsMade: job ? job.attemptsMade : 0,
    });
  }

  console.log('\n Sample of 5 Rate-Limited Emails in BullMQ:');
  for (const s of rateLimitedSamples) {
    console.log(`    [${s.recipient}] ID: ${s.id}`);
    console.log(`      - Original DB scheduled_at: ${s.originalScheduledAt}`);
    console.log(`      - BullMQ State:            ${s.bullmqState}`);
    console.log(`      - BullMQ Delay:            ${s.bullmqDelay}ms (~${Math.round(s.bullmqDelay / 1000 / 60)} mins)`);
    console.log(`      - Attempts Made:           ${s.attemptsMade}`);
  }

  console.log('\n Investigating Database scheduled_at vs BullMQ Delay:');
  const dbSample = await pool.query(`SELECT scheduled_at, status FROM emails WHERE id = $1`, [rateLimitedSamples[0].id]);
  console.log(`   - Database scheduled_at remains: ${dbSample.rows[0].scheduled_at.toISOString()}`);
  console.log(`   - Status in Database:            '${dbSample.rows[0].status}'`);
  console.log(`   - Observation: Database stores the ORIGINAL user-configured schedule time, while BullMQ manages the dynamic rate-limit postponement internally.`);

  console.log('\n5 Processing Remaining Batches (Advancing rolling window slots)...');
  const batchSize = 10;
  const numBatches = Math.ceil(totalRecipients / batchSize);

  for (let batch = 1; batch < numBatches; batch++) {
    console.log(`\n Simulating 1-hour rolling window expiration for Batch ${batch + 1}/${numBatches}...`);

    const zsetEntries = (await (redisClient as any).zrange(rateLimitKey, 0, -1, 'WITHSCORES')) as string[];
    const expiredTimestamp = Date.now() - (60 * 60 * 1000 + 10000);

    for (let i = 0; i < zsetEntries.length; i += 2) {
      const member = zsetEntries[i];
      await (redisClient as any).zadd(rateLimitKey, expiredTimestamp, member);
    }

    await redisClient.zremrangebyscore(rateLimitKey, '-inf', Date.now() - (60 * 60 * 1000));

    const startIdx = batch * batchSize;
    const endIdx = Math.min(startIdx + batchSize, totalRecipients);

    for (let i = startIdx; i < endIdx; i++) {
      const item = emailRecords[i];

      await addEmailJob(item.id, null, (i - startIdx) * 350);
    }

    const batchWaitStart = Date.now();
    while (Date.now() - batchWaitStart < 35000) {
      await new Promise((r) => setTimeout(r, 1000));
      const sentCountRes = await pool.query(
        `SELECT COUNT(*) FROM emails WHERE id LIKE 'sch_100t_${baseTime}_%' AND status = 'sent'`
      );
      const currentSent = parseInt(sentCountRes.rows[0].count, 10);
      if (currentSent >= endIdx) {
        console.log(`    Batch ${batch + 1} processed! Total Sent so far: ${currentSent}/${totalRecipients}`);
        break;
      }
    }
  }

  console.log('\n6 Compiling Final Comprehensive Metrics...');

  const finalDbMetrics = await pool.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'failed') as failed
    FROM emails
    WHERE id LIKE 'sch_100t_${baseTime}_%'
  `);

  const dbRow = finalDbMetrics.rows[0];
  const totalEmails = parseInt(dbRow.total, 10);
  const totalSent = parseInt(dbRow.sent, 10);
  const totalScheduled = parseInt(dbRow.scheduled, 10);
  const totalProcessing = parseInt(dbRow.processing, 10);
  const totalFailed = parseInt(dbRow.failed, 10);

  const bmqWaiting = await emailQueue.getWaitingCount();
  const bmqDelayed = await emailQueue.getDelayedCount();
  const bmqCompleted = await emailQueue.getCompletedCount();
  const bmqFailed = await emailQueue.getFailedCount();

  for (const s of rateLimitedSamples) {
    const res = await pool.query(
      `SELECT status, sent_at, provider_message_id FROM emails WHERE id = $1`,
      [s.id]
    );
    const row = res.rows[0];
    s.finalStatus = row.status;
    s.sentAt = row.sent_at ? new Date(row.sent_at).toISOString() : '';
    s.providerMessageId = row.provider_message_id;
  }

  const messageIdCheck = await pool.query(
    `SELECT provider_message_id, COUNT(*) FROM emails WHERE id LIKE 'sch_100t_${baseTime}_%' GROUP BY provider_message_id HAVING COUNT(*) > 1`
  );
  const duplicatesCount = messageIdCheck.rows.length;

  console.log('\n========================================================================');
  console.log(' FINAL 100-RECIPIENT TEST REPORT');
  console.log('========================================================================');
  console.log(`1. Total emails created:    ${totalEmails}`);
  console.log(`2. Total sent:              ${totalSent}`);
  console.log(`3. Total still scheduled:   ${totalScheduled}`);
  console.log(`4. Total processing:        ${totalProcessing}`);
  console.log(`5. Total failed:            ${totalFailed}`);
  console.log('------------------------------------------------------------------------');
  console.log(`6. BullMQ waiting count:    ${bmqWaiting}`);
  console.log(`7. BullMQ delayed count:    ${bmqDelayed}`);
  console.log(`8. BullMQ completed count:  ${bmqCompleted}`);
  console.log(`9. BullMQ failed count:     ${bmqFailed}`);
  console.log(`10. Duplicate sends:        ${duplicatesCount === 0 ? '0 (ALL UNIQUE)' : duplicatesCount}`);
  console.log('========================================================================\n');

  console.log(' FINAL STATUS OF 5 RATE-LIMITED SAMPLE EMAILS:');
  console.log('------------------------------------------------------------------------');
  for (const s of rateLimitedSamples) {
    console.log(` Recipient:              ${s.recipient}`);
    console.log(`   - Original scheduled_at: ${s.originalScheduledAt}`);
    console.log(`   - BullMQ Initial State:  ${s.bullmqState} (Delay: ${s.bullmqDelay}ms)`);
    console.log(`   - Final DB Status:       ${s.finalStatus}`);
    console.log(`   - Sent At:               ${s.sentAt}`);
    console.log(`   - Provider Message ID:   ${s.providerMessageId}`);
    console.log('------------------------------------------------------------------------');
  }

  await worker.close();
  await emailQueue.close();
  await redisClient.quit();
  await pool.end();

  const success = totalSent === 100 && totalScheduled === 0 && totalProcessing === 0 && totalFailed === 0 && duplicatesCount === 0;
  console.log(`\n Test Result: ${success ? 'PASSED - ALL 100 EMAILS DELIVERED WITH ZERO ERRORS / DUPLICATES' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}

run100RecipientTest().catch(async (err) => {
  console.error(' Test failed with exception:', err);
  await redisClient.quit().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
