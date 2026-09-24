import { calculateDelay } from '../modules/queue/email.queue';

async function runTimezoneTests() {
  console.log('Testing timezone scheduling calculations...');

  // Test Case 1: IST timestamp simulation (e.g. user selects 10:30 AM IST on Sept 25, 2026)
  // 10:30 AM IST is 05:00:00 UTC
  const istIsoString = '2026-09-25T05:00:00.000Z';
  const targetEpoch = new Date(istIsoString).getTime();

  // Verify Date parsing
  const parsedDate = new Date(istIsoString);
  if (parsedDate.toISOString() !== '2026-09-25T05:00:00.000Z') {
    throw new Error(`Expected UTC ISO 2026-09-25T05:00:00.000Z, got ${parsedDate.toISOString()}`);
  }

  // Test Case 2: Future delay calculation
  const futureInstant = new Date(Date.now() + 120 * 1000).toISOString();
  const delay = calculateDelay(futureInstant);
  if (delay < 110000 || delay > 125000) {
    throw new Error(`Expected delay ~120000ms, got ${delay}ms`);
  }

  // Test Case 3: Past delay calculation (should return 0)
  const pastInstant = new Date(Date.now() - 60 * 1000).toISOString();
  const pastDelay = calculateDelay(pastInstant);
  if (pastDelay !== 0) {
    throw new Error(`Expected 0ms for past time, got ${pastDelay}ms`);
  }

  // Test Case 4: Browser local datetime conversion verification
  // When an input of '2026-09-25T10:30' is parsed in an environment with offset +05:30:
  // (new Date('2026-09-25T10:30+05:30')).toISOString() === '2026-09-25T05:00:00.000Z'
  const explicitIstString = '2026-09-25T10:30:00+05:30';
  const explicitIstDate = new Date(explicitIstString);
  if (explicitIstDate.toISOString() !== '2026-09-25T05:00:00.000Z') {
    throw new Error(`Expected '2026-09-25T05:00:00.000Z', got ${explicitIstDate.toISOString()}`);
  }

  console.log('All timezone scheduling tests passed successfully.');
  process.exit(0);
}

runTimezoneTests().catch((err) => {
  console.error('Timezone test error:', err);
  process.exit(1);
});
