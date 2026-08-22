import { test, expect } from 'vitest';

const BASE_URL = 'http://localhost:8080';

// Mock secret for testing environment if needed, 
// but we want to test against the ACTUAL environment to see if it's currently open.
const TARGETS = [
  '/api/public/hooks/test-email-alerts',
  '/api/public/hooks/pm-generate',
  '/api/public/hooks/scan-canh-bao',
  '/api/public/hooks/r2-cleanup',
  '/api/public/hooks/reliability-report',
];

test.each(TARGETS)('%s should be secured', async (path) => {
  // Test 1: No header
  const resNoHeader = await fetch(`${BASE_URL}${path}`, { method: 'POST' });
  // Should not be 200. Expected 401 or 404.
  expect(resNoHeader.status, `Endpoint ${path} should not be public (no auth)` ).not.toBe(200);

  // Test 2: Wrong secret
  const resWrongSecret = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'x-cron-secret': 'wrong',
      'x-backup-secret': 'wrong',
      'apikey': 'wrong',
      'Authorization': 'Bearer wrong'
    }
  });
  expect(resWrongSecret.status, `Endpoint ${path} should reject wrong secret`).toBe(401);
});

test('/api/public/hooks/test-email-alerts restriction', async () => {
  const path = '/api/public/hooks/test-email-alerts';
  // Try to send to an arbitrary email
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify({ to: 'attacker@example.com' }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (res.status === 200) {
    const data = await res.json();
    expect(data.recipient).not.toBe('attacker@example.com');
  }
});
