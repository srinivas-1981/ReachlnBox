import { pool, initDb } from '../config/db';
import { redisClient } from '../config/redis';
import { storeService } from '../services/store.service';
import { startEmailWorker } from '../modules/queue/email.worker';

async function dispatchPausedEmails() {
  console.log('====================================================');
  console.log(' Finding & Dispatching All Paused Emails Immediately');
  console.log('====================================================');

  await initDb();
  const worker = startEmailWorker();
  await worker.waitUntilReady();

  const res = await pool.query(
    `SELECT id, recipient, subject, scheduled_at as "scheduledAt", status FROM emails WHERE status = 'paused' ORDER BY created_at ASC`
  );

  console.log(`Found ${res.rows.length} paused email(s):`);
  for (const row of res.rows) {
    console.log(` - ID: ${row.id} | To: ${row.recipient} | Subject: "${row.subject}"`);
  }

  if (res.rows.length === 0) {
    console.log('No paused emails found in database.');
  } else {
    const ids = res.rows.map((r) => r.id);
    const now = new Date();

    for (const email of res.rows) {
      console.log(`\nResuming email ${email.id} for immediate delivery (scheduled_at = NOW)...`);
      await storeService.resumeScheduled(email.id, undefined, now);
    }

    console.log('\nWaiting for BullMQ worker to process and send...');
    const waitStart = Date.now();
    let allDone = false;

    while (Date.now() - waitStart < 25000) {
      await new Promise((r) => setTimeout(r, 1000));
      const check = await pool.query(
        `SELECT id, recipient, subject, status, provider_message_id, sent_at FROM emails WHERE id = ANY($1)`,
        [ids]
      );

      const pending = check.rows.filter((r) => r.status !== 'sent' && r.status !== 'failed');
      if (pending.length === 0) {
        allDone = true;
        console.log('\nAll paused emails have completed processing:');
        for (const r of check.rows) {
          console.log(` - Email: ${r.id} | Status: ${r.status} | SentAt: ${r.sent_at} | ProviderMessageID: ${r.provider_message_id}`);
        }
        break;
      } else {
        console.log(` - [${Math.round((Date.now() - waitStart) / 1000)}s] Waiting... (${check.rows.filter((r) => r.status === 'sent').length}/${ids.length} sent)`);
      }
    }

    if (!allDone) {
      const check = await pool.query(
        `SELECT id, recipient, subject, status, provider_message_id, sent_at FROM emails WHERE id = ANY($1)`,
        [ids]
      );
      console.log('\nCurrent status of emails:');
      for (const r of check.rows) {
        console.log(` - Email: ${r.id} | Status: ${r.status} | SentAt: ${r.sent_at}`);
      }
    }
  }

  console.log('====================================================');
  await worker.close();
  await redisClient.quit();
  await pool.end();
}

dispatchPausedEmails().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
