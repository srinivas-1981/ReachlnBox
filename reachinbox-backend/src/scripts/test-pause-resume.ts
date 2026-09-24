import { initDb, pool } from '../config/db';
import { redisClient } from '../config/redis';
import { addEmailJob, emailQueue } from '../modules/queue/email.queue';
import { startEmailWorker } from '../modules/queue/email.worker';
import { storeService } from '../services/store.service';

async function runPauseResumeTest() {
  console.log('====================================================');
  console.log(' Starting Pause & Resume / Reschedule Lifecycle Test');
  console.log('====================================================');

  await initDb();
  const worker = startEmailWorker();
  await worker.waitUntilReady();
  console.log(' BullMQ Worker initialized and ready.');

  const emailId = `sch_test_pr_${Date.now()}`;
  const futureTime = new Date(Date.now() + 60000); // 60s in future

  // Step 1: Insert scheduled email
  console.log(`\n1. Creating scheduled email: ${emailId}`);
  await pool.query(
    `
    INSERT INTO emails (id, user_id, recipient, subject, snippet, body, scheduled_at, status, delay_seconds, hourly_limit)
    VALUES ($1, 'usr_reach_01', 'pause.test@example.com', 'Pause and Resume Verification', 'Testing pause/resume', 'Testing that paused emails resume cleanly into BullMQ', $2, 'scheduled', 0, 100)
    `,
    [emailId, futureTime.toISOString()]
  );
  await addEmailJob(emailId, futureTime);

  let record = await storeService.getEmailForDispatch(emailId);
  console.log(` - Email created. Status: ${record?.status}`);

  // Step 2: Pause the email
  console.log(`\n2. Pausing scheduled email: ${emailId}`);
  const paused = await storeService.pauseScheduled(emailId, 'usr_reach_01');
  console.log(` - Pause result: ${paused}`);
  record = await storeService.getEmailForDispatch(emailId);
  console.log(` - Status in DB: ${record?.status}`);

  // Step 3: Resume the email (reschedules for immediate/new dispatch)
  console.log(`\n3. Resuming / Rescheduling paused email: ${emailId}`);
  const resumeTime = new Date(Date.now() + 2000); // 2s in future
  const resumed = await storeService.resumeScheduled(emailId, 'usr_reach_01', resumeTime);
  console.log(` - Resume result: ${resumed}`);
  record = await storeService.getEmailForDispatch(emailId);
  console.log(` - Status in DB: ${record?.status}, Scheduled For: ${record?.scheduledAt}`);

  // Step 4: Wait for BullMQ worker to dispatch and mark as sent
  console.log(`\n4. Waiting for BullMQ worker to pick up and deliver the resumed email...`);
  const waitStart = Date.now();
  let delivered = false;

  while (Date.now() - waitStart < 20000) {
    await new Promise((r) => setTimeout(r, 1000));
    const check = await pool.query(
      `SELECT id, status, sent_at, provider_message_id, error_message FROM emails WHERE id = $1`,
      [emailId]
    );
    const row = check.rows[0];
    console.log(` - [${Math.round((Date.now() - waitStart) / 1000)}s] DB Status: ${row?.status}`);

    if (row && row.status === 'sent') {
      delivered = true;
      console.log(`\n SUCCESS: Resumed email successfully delivered!`);
      console.log(` - Message ID: ${row.provider_message_id}`);
      console.log(` - Sent At: ${row.sent_at}`);
      break;
    }
  }

  console.log('====================================================');
  if (!delivered) {
    console.error(' FAILED: Resumed email did not transition to sent status.');
    process.exit(1);
  } else {
    console.log(' ALL PAUSE/RESUME/RESCHEDULE CHECKS PASSED!');
  }
  console.log('====================================================');

  await worker.close();
  await redisClient.quit();
  await pool.end();
}

runPauseResumeTest().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
