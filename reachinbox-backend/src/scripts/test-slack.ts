import { initDb, pool } from '../config/db';
import { storeService } from '../services/store.service';
import { slackService } from '../services/slack.service';

async function runSlackTest() {
  console.log('====================================================');
  console.log(' Starting Slack Integration & Rate Limit Alert Test');
  console.log('====================================================');

  await initDb();

  // Test 1: Connect Slack
  console.log('\n1. Connecting Slack workspace for usr_reach_01...');
  await storeService.setSlackStatus(true, 'usr_reach_01');
  let status = await storeService.getSlackStatus('usr_reach_01');
  console.log(' Slack status after connect:', status);
  if (!status.connected) {
    throw new Error('Expected status.connected to be true');
  }

  // Test 2: Trigger Rate Limit Notification
  console.log('\n2. Testing rate-limit alert dispatch...');
  const alertSent = await slackService.sendRateLimitNotification('usr_reach_01', {
    emailId: `sch_slk_${Date.now()}`,
    subject: 'Slack Alert Test Verification',
    recipient: 'test.recipient@domain.com',
    hourlyLimit: 50,
    retryAfterMs: 60000,
  });
  console.log(` Alert dispatch handled (result: ${alertSent})`);

  // Test 3: Disconnect Slack
  console.log('\n3. Disconnecting Slack workspace...');
  await storeService.setSlackStatus(false, 'usr_reach_01');
  status = await storeService.getSlackStatus('usr_reach_01');
  console.log(' Slack status after disconnect:', status);
  if (status.connected) {
    throw new Error('Expected status.connected to be false');
  }

  // Test 4: Re-connect for production demo default
  console.log('\n4. Re-enabling Slack connection for demo...');
  await storeService.setSlackStatus(true, 'usr_reach_01');
  status = await storeService.getSlackStatus('usr_reach_01');
  console.log(' Final Slack status:', status);

  console.log('\n====================================================');
  console.log(' ALL SLACK INTEGRATION CHECKS PASSED!');
  console.log('====================================================');

  await pool.end();
}

runSlackTest().catch((err) => {
  console.error('Slack test failed:', err);
  process.exit(1);
});
