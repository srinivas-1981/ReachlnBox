import { initDb, pool } from '../config/db';
import { redisClient } from '../config/redis';
import { addEmailJob } from '../modules/queue/email.queue';
import { processEmailJob, startEmailWorker } from '../modules/queue/email.worker';
import { emailService } from '../modules/email/email.service';
import { storeService } from '../services/store.service';
import { config } from '../config/env';

async function runControlledPoolTest() {
  console.log('====================================================');
  console.log(' Starting Controlled 10-Email SMTP Pool Test');
  console.log('====================================================');

  await initDb();

  const timings: number[] = [];
  let successfulFirstAttempts = 0;
  let smtpFailures = 0;
  let retries = 0;
  let finalSentCount = 0;

  // ---------------------------------------------------------
  // Part A: 5 Sequential Emails
  // ---------------------------------------------------------
  console.log('\n--- PART A: 5 Sequential Emails via Pooled Transporter ---');
  for (let i = 1; i <= 5; i++) {
    const emailId = `sch_seq_${Date.now()}_${i}`;
    const scheduledTime = new Date();
    await pool.query(
      `
      INSERT INTO emails (id, user_id, recipient, subject, snippet, body, scheduled_at, status, delay_seconds, hourly_limit)
      VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, $6, 'processing', 0, 100)
      `,
      [
        emailId,
        `seq.test.${i}@example.com`,
        `Sequential Test Email ${i}`,
        `Test body ${i}`,
        `This is sequential test body ${i} for connection pool reuse.`,
        scheduledTime.toISOString(),
      ]
    );

    const sendStart = Date.now();
    try {
      const sendResult = await emailService.sendEmail({
        to: `seq.test.${i}@example.com`,
        subject: `Sequential Test Email ${i}`,
        text: `Sequential email body ${i}`,
      });
      const elapsed = Date.now() - sendStart;
      timings.push(elapsed);
      successfulFirstAttempts++;

      await storeService.markEmailSent(emailId, sendResult.messageId);
      const row = await storeService.getEmailForDispatch(emailId);
      if (row?.status === 'sent') {
        finalSentCount++;
        console.log(` Sequential Email #${i} (${emailId}): SENT in ${elapsed}ms (Status: ${row.status})`);
      }
    } catch (err: any) {
      const elapsed = Date.now() - sendStart;
      timings.push(elapsed);
      smtpFailures++;
      console.error(` Sequential Email #${i} (${emailId}): FAILED in ${elapsed}ms - ${err?.message}`);
      await storeService.resetEmailToScheduled(emailId);
    }
  }

  // ---------------------------------------------------------
  // Part B: 5 Concurrent Emails via BullMQ Worker (Concurrency = 5)
  // ---------------------------------------------------------
  console.log('\n--- PART B: 5 Concurrent Emails via BullMQ Worker (Concurrency 5) ---');
  const worker = startEmailWorker();
  await worker.waitUntilReady();

  const workerEmailIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const emailId = `sch_conc_${Date.now()}_${i}`;
    workerEmailIds.push(emailId);
    const scheduledTime = new Date(Date.now() + 1000); // 1s delay

    await pool.query(
      `
      INSERT INTO emails (id, user_id, recipient, subject, snippet, body, scheduled_at, status, delay_seconds, hourly_limit)
      VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, $6, 'scheduled', 0, 100)
      `,
      [
        emailId,
        `conc.test.${i}@example.com`,
        `Concurrent Test Email ${i}`,
        `Concurrent body ${i}`,
        `This is concurrent test body ${i} dispatched through BullMQ.`,
        scheduledTime.toISOString(),
      ]
    );

    await addEmailJob(emailId, scheduledTime);
  }

  console.log(` Queued 5 jobs in BullMQ. Waiting for processing...`);

  const pollStart = Date.now();
  const completedIds = new Set<string>();

  while (Date.now() - pollStart < 30000 && completedIds.size < workerEmailIds.length) {
    await new Promise((r) => setTimeout(r, 1000));
    for (const emailId of workerEmailIds) {
      if (completedIds.has(emailId)) continue;
      const check = await pool.query(
        `SELECT id, status, sent_at, provider_message_id, error_message FROM emails WHERE id = $1`,
        [emailId]
      );
      const row = check.rows[0];
      if (row && row.status === 'sent') {
        completedIds.add(emailId);
        successfulFirstAttempts++;
        finalSentCount++;
        console.log(` Worker Email ${emailId}: SENT (providerMsgId: ${row.provider_message_id})`);
      } else if (row && row.status === 'failed') {
        completedIds.add(emailId);
        smtpFailures++;
        console.log(` Worker Email ${emailId}: FAILED permanently (Error: ${row.error_message})`);
      }
    }
  }

  // Calculate stats
  const avgSendTime = timings.length > 0 ? (timings.reduce((a, b) => a + b, 0) / timings.length).toFixed(1) : 'N/A';

  console.log('\n====================================================');
  console.log(' Controlled Test Results Summary');
  console.log('====================================================');
  console.log(`Total Emails Tested:       10 (5 sequential + 5 via BullMQ)`);
  console.log(`Successful First Attempts: ${successfulFirstAttempts}`);
  console.log(`SMTP Failures:             ${smtpFailures}`);
  console.log(`Retries Triggered:         ${retries}`);
  console.log(`Final Sent Count:          ${finalSentCount}/10`);
  console.log(`Average Direct Send Time:  ${avgSendTime}ms`);
  console.log('====================================================');

  await worker.close();
  await redisClient.quit();
  await pool.end();
}

runControlledPoolTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
