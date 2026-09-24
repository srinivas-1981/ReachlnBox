import { initDb, pool } from '../config/db';
import { redisClient } from '../config/redis';
import { addEmailJob, emailQueue } from '../modules/queue/email.queue';
import { startEmailWorker } from '../modules/queue/email.worker';
import { storeService } from '../services/store.service';
import { verifySmtpConnection } from '../modules/email/smtp.client';

async function runEndToEndTest() {
  console.log('====================================================');
  console.log('🧪 Starting ReachInbox BullMQ Pipeline End-to-End Test');
  console.log('====================================================');

  // 1. Initialize DB and Verify SMTP
  await initDb();
  const smtpReady = await verifySmtpConnection();
  if (!smtpReady) {
    console.error('❌ SMTP not ready. Aborting test.');
    process.exit(1);
  }

  // 2. Start the BullMQ Worker
  const worker = startEmailWorker();
  await worker.waitUntilReady();
  console.log('✅ BullMQ Worker initialized and listening to email-dispatch-queue');

  // 3. Create a test email scheduled 3 seconds into the future
  const emailId = `sch_e2e_${Date.now()}`;
  const scheduledTime = new Date(Date.now() + 3000); // 3 seconds in future
  const recipient = 'sarah.connor@acme-corp.com';
  const subject = 'ReachInbox Automated Pipeline Verification';
  const body = 'This email confirms the full BullMQ + Redis + Nodemailer + PostgreSQL pipeline is working.';

  console.log(`\n1️⃣ Inserting email into PostgreSQL: ${emailId}`);
  await pool.query(
    `
    INSERT INTO emails (id, user_id, recipient, subject, snippet, body, scheduled_at, status, delay_seconds, hourly_limit)
    VALUES ($1, 'usr_reach_01', $2, $3, $4, $5, $6, 'scheduled', 2, 100)
    `,
    [emailId, recipient, subject, body.substring(0, 80), body, scheduledTime.toISOString()]
  );

  // Verify status is scheduled
  let dbRecord = await storeService.getEmailForDispatch(emailId);
  console.log(`📊 Initial DB Status: ${dbRecord?.status} (Scheduled for: ${scheduledTime.toISOString()})`);

  // 4. Create BullMQ delayed job
  console.log(`\n2️⃣ Adding delayed BullMQ job for email: ${emailId}`);
  const job = await addEmailJob(emailId, scheduledTime);
  console.log(`📦 BullMQ Job created with Job ID: ${job.id}, Delay: ${job.opts.delay}ms`);

  // 5. Monitor status transition
  console.log('\n3️⃣ Waiting for BullMQ worker to process the job...');
  const startTime = Date.now();
  let finalRecord: any = null;

  while (Date.now() - startTime < 25000) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const check = await pool.query(
      `SELECT id, status, sent_at, provider_message_id, error_message FROM emails WHERE id = $1`,
      [emailId]
    );
    const row = check.rows[0];
    console.log(`⏱️ [${Math.round((Date.now() - startTime) / 1000)}s] Status in PostgreSQL: ${row.status}`);

    if (row.status === 'sent') {
      finalRecord = row;
      break;
    }
    if (row.status === 'failed') {
      finalRecord = row;
      break;
    }
  }

  console.log('====================================================');
  if (finalRecord && finalRecord.status === 'sent') {
    console.log('🎉 TEST SUCCESSFUL! Complete delivery pipeline verified:');
    console.log(`   - Email ID: ${finalRecord.id}`);
    console.log(`   - Final Status: ${finalRecord.status}`);
    console.log(`   - Sent At: ${finalRecord.sent_at}`);
    console.log(`   - Provider Message ID: ${finalRecord.provider_message_id}`);
  } else {
    console.error('❌ TEST FAILED: Email did not reach sent state.');
    if (finalRecord) {
      console.error(`   - Status: ${finalRecord.status}`);
      console.error(`   - Error: ${finalRecord.error_message}`);
    }
  }
  console.log('====================================================');

  // Clean shutdown for test script
  console.log('🧹 Cleaning up test worker and connections...');
  await worker.close();
  await emailQueue.close();
  await redisClient.quit();
  await pool.end();
  console.log('✅ Test finished cleanly.');
  process.exit(finalRecord?.status === 'sent' ? 0 : 1);
}

runEndToEndTest();
