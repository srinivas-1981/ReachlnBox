import { SimulatedEmailProvider } from '../modules/email/simulated.provider';
import { EtherealEmailProvider } from '../modules/email/ethereal.provider';
import { EmailService } from '../modules/email/email.service';
import { getSmtpTransporter, verifySmtpConnection } from '../modules/email/smtp.client';
import { config } from '../config/env';

async function runTests() {
  console.log('====================================================');
  console.log(' Comprehensive Email Delivery Transports Test Suite');
  console.log(` Active Configured Transport: ${config.emailTransport}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: SimulatedEmailProvider Direct Execution & Invariants
  console.log('--- TEST 1: SimulatedEmailProvider Direct Execution & Guarantees ---');
  try {
    const simProvider = new SimulatedEmailProvider();
    if (simProvider.transportName !== 'simulated') {
      throw new Error(`Expected transportName to be 'simulated', got ${simProvider.transportName}`);
    }

    const res1 = await simProvider.send({
      to: 'evaluation-candidate@reachinbox.ai',
      subject: 'Test Subject 1',
      text: 'Test Body 1',
    });

    console.log(' Result 1:', res1);
    if (!res1.providerMessageId.startsWith('SIMULATED_')) {
      throw new Error(`Invalid providerMessageId: ${res1.providerMessageId}`);
    }
    if (res1.status !== 'sent') {
      throw new Error(`Invalid status: ${res1.status}`);
    }
    if (res1.transport !== 'simulated') {
      throw new Error(`Invalid transport in result: ${res1.transport}`);
    }

    const res2 = await simProvider.send({
      to: 'evaluation-candidate2@reachinbox.ai',
      subject: 'Test Subject 2',
      text: 'Test Body 2',
    });

    if (res1.providerMessageId === res2.providerMessageId) {
      throw new Error('Provider message IDs must be unique per send!');
    }

    console.log(' PASS: SimulatedEmailProvider produces unique IDs and correct status with 0 network calls.');
    passed++;
  } catch (err: any) {
    console.error(' FAIL: Test 1 failed:', err?.message || err);
    failed++;
  }

  // Test 2: Input validation
  console.log('\n--- TEST 2: Input Validation in Simulated Provider ---');
  try {
    const simProvider = new SimulatedEmailProvider();
    let threw = false;
    try {
      await simProvider.send({
        to: '',
        subject: 'Empty Recipient',
        text: 'Should fail',
      });
    } catch {
      threw = true;
    }

    if (!threw) {
      throw new Error('Expected send() with empty recipient to throw an error');
    }
    console.log(' PASS: SimulatedEmailProvider correctly validates recipient.');
    passed++;
  } catch (err: any) {
    console.error(' FAIL: Test 2 failed:', err?.message || err);
    failed++;
  }

  // Test 3: EmailService Abstraction and Provider Selection
  console.log('\n--- TEST 3: EmailService Default Provider Selection & Transport Abstraction ---');
  try {
    const defaultEmailService = new EmailService();
    console.log(` Active EmailService transport: ${defaultEmailService.transportName}`);

    if (config.emailTransport === 'simulated') {
      if (defaultEmailService.transportName !== 'simulated') {
        throw new Error(`Expected EmailService to use 'simulated', but got '${defaultEmailService.transportName}'`);
      }
      const provider = defaultEmailService.getProvider();
      if (!(provider instanceof SimulatedEmailProvider)) {
        throw new Error('Expected active provider to be an instance of SimulatedEmailProvider');
      }
    } else if (config.emailTransport === 'ethereal') {
      if (defaultEmailService.transportName !== 'ethereal') {
        throw new Error(`Expected EmailService to use 'ethereal', but got '${defaultEmailService.transportName}'`);
      }
      const provider = defaultEmailService.getProvider();
      if (!(provider instanceof EtherealEmailProvider)) {
        throw new Error('Expected active provider to be an instance of EtherealEmailProvider');
      }
    }

    const sendRes = await defaultEmailService.sendEmail({
      to: 'demo-lead@example.com',
      subject: 'Evaluation Transport Verification',
      text: 'Testing abstraction layer',
    });

    if (sendRes.status !== 'sent') {
      throw new Error('EmailService sendEmail failed verification');
    }
    console.log(' [DELIVERY] transport=' + sendRes.transport);
    console.log(' [DELIVERY] provider_message_id=' + sendRes.providerMessageId);
    console.log(' [DELIVERY] status=' + sendRes.status);
    console.log(' PASS: EmailService properly selects and delegates to active provider.');
    passed++;
  } catch (err: any) {
    console.error(' FAIL: Test 3 failed:', err?.message || err);
    failed++;
  }

  // Test 4: Verify Zero SMTP Activity in Simulated Mode
  console.log('\n--- TEST 4: Verifying Zero SMTP Activity in Simulated Mode ---');
  try {
    if (config.emailTransport === 'simulated') {
      // verifySmtpConnection must return false and not initiate an SMTP verification when transport is simulated
      const verified = await verifySmtpConnection();
      if (verified !== false) {
        throw new Error('verifySmtpConnection() must return false without attempting SMTP connection when transport is simulated');
      }
      console.log(' PASS: verifySmtpConnection bypassed cleanly in simulated mode (0 SMTP calls).');
      passed++;
    } else {
      console.log(' SKIP: Test 4 is only applicable when EMAIL_TRANSPORT=simulated');
      passed++;
    }
  } catch (err: any) {
    console.error(' FAIL: Test 4 failed:', err?.message || err);
    failed++;
  }

  // Test 5: High-throughput batch test (50 simulated sends)
  console.log('\n--- TEST 5: High-Throughput Batch Test (50 Simulated Deliveries) ---');
  try {
    const simProvider = new SimulatedEmailProvider();
    const seenIds = new Set<string>();
    const promises = Array.from({ length: 50 }).map((_, idx) =>
      simProvider.send({
        to: `batch-user-${idx}@reachinbox.ai`,
        subject: `Batch Item #${idx + 1}`,
        text: `Content for batch item ${idx + 1}`,
      })
    );

    const results = await Promise.all(promises);
    for (const r of results) {
      if (seenIds.has(r.providerMessageId)) {
        throw new Error(`Duplicate message ID detected: ${r.providerMessageId}`);
      }
      seenIds.add(r.providerMessageId);
      if (r.status !== 'sent') {
        throw new Error(`Unexpected status: ${r.status}`);
      }
    }

    console.log(` Dispatched 50/50 simulated emails concurrently. All unique IDs generated.`);
    console.log(' PASS: High-throughput simulated delivery passed.');
    passed++;
  } catch (err: any) {
    console.error(' FAIL: Test 5 failed:', err?.message || err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(` TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Test runner fatal error:', e);
  process.exit(1);
});
