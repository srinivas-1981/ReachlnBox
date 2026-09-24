import { pool, initDb } from '../config/db';
import { redisClient } from '../config/redis';
import { storeService } from '../services/store.service';
import { startEmailWorker } from '../modules/queue/email.worker';
import { addEmailJob } from '../modules/queue/email.queue';

async function checkAndSendAllPending() {
  console.log('====================================================');
  console.log(' Check All Emails in Database & Dispatch');
  console.log('====================================================');

  await initDb();
  const worker = startEmailWorker();
  await worker.waitUntilReady();

  const allEmails = await pool.query(
    `SELECT id, user_id as "userId", recipient, subject, scheduled_at as "scheduledAt", status, sent_at as "sentAt", provider_message_id as "providerMessageId" 
     FROM emails 
     ORDER BY created_at DESC 
     LIMIT 25`
  );

  console.log(`\nFound ${allEmails.rows.length} total recent emails in DB:`);
  for (const r of allEmails.rows) {
    console.log(` - ID: ${r.id} | Status: [${r.status}] | To: ${r.recipient} | Subject: "${r.subject}" | Scheduled: ${r.scheduledAt}`);
  }

  // Find any paused or pending scheduled emails
  const pendingToSend = allEmails.rows.filter(
    (r) => r.status === 'paused' || r.status === 'scheduled' || r.status === 'draft'
  );

  if (pendingToSend.length === 0) {
    console.log('\nAll emails in database are already in "sent" status.');
    console.log('Creating a test scheduled email to demonstrate immediate pause -> resume -> immediate send cycle...');

    const testId = `sch_user_immediate_${Date.now()}`;
    await pool.query(
      `
      INSERT INTO emails (id, user_id, recipient, subject, snippet, body, scheduled_at, status, delay_seconds, hourly_limit)
      VALUES ($1, 'usr_reach_01', 'demo.client@reachinbox.ai', 'Immediate Paused Email Delivery Test', 'Demo email delivery', 'This email was paused and then immediately dispatched upon request.', NOW(), 'paused', 0, 100)
      `,
      [testId]
    );

    console.log(`Created paused email: ${testId}`);
    console.log('Resuming & dispatching immediately...');
    await storeService.resumeScheduled(testId, undefined, new Date());
    pendingToSend.push({ id: testId, status: 'scheduled' });
  } else {
    console.log(`\nDispatching ${pendingToSend.length} pending/paused email(s) immediately...`);
    for (const email of pendingToSend) {
      console.log(` - Enqueueing immediate send for ${email.id}...`);
      await storeService.resumeScheduled(email.id, undefined, new Date());
    }
  }

  console.log('\nWaiting for worker delivery...');
  const targetIds = pendingToSend.map((e) => e.id);
  const startWait = Date.now();

  while (Date.now() - startWait < 20000) {
    await new Promise((r) => setTimeout(r, 1000));
    const check = await pool.query(
      `SELECT id, recipient, subject, status, provider_message_id, sent_at FROM emails WHERE id = ANY($1)`,
      [targetIds]
    );

    const pending = check.rows.filter((r) => r.status !== 'sent' && r.status !== 'failed');
    if (pending.length === 0) {
      console.log('\n All emails successfully processed:');
      for (const r of check.rows) {
        console.log(` - ID: ${r.id} | Status: ${r.status} | SentAt: ${r.sent_at} | MessageID: ${r.provider_message_id}`);
      }
      break;
    }
  }

  console.log('====================================================');
  await worker.close();
  await redisClient.quit();
  await pool.end();
}

checkAndSendAllPending().catch((err) => {
  console.error('Execution error:', err);
  process.exit(1);
});
