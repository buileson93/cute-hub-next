import { test, expect } from 'vitest';

const BASE_URL = 'http://localhost:8080';

const TARGETS = [
  { path: '/api/public/hooks/test-email-alerts', secretHeader: 'x-test-secret' },
  { path: '/api/public/hooks/pm-generate', secretHeader: 'x-cron-secret' },
  { path: '/api/public/hooks/scan-canh-bao', secretHeader: 'x-cron-secret' },
  { path: '/api/public/hooks/r2-cleanup', secretHeader: 'x-cron-secret' },
  { path: '/api/public/hooks/reliability-report', secretHeader: 'x-cron-secret' },
];

test.each(TARGETS)('%s should be secured', async ({ path, secretHeader }) => {
  // Test 1: No header
  const resNoHeader = await fetch(`${BASE_URL}${path}`, { method: 'POST' });
  // If secret not configured -> 404, if configured but missing -> 401
  expect([401, 404]).toContain(resNoHeader.status);

  // Test 2: Wrong secret
  const headers: Record<string, string> = {};
  headers[secretHeader] = 'wrong-secret-value';
  
  const resWrongSecret = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers
  });
  
  // Should NOT be 500. Should be 401 or 404.
  expect(resWrongSecret.status, `Endpoint ${path} should reject wrong secret with 401/404, not ${resWrongSecret.status}`).toBeTypeOf('number');
  expect([401, 404]).toContain(resWrongSecret.status);
});

test('/api/public/hooks/test-email-alerts restriction', async () => {
  const path = '/api/public/hooks/test-email-alerts';
  // Try to send to an arbitrary email without valid secret first
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: JSON.stringify({ to: 'attacker@example.com' }),
    headers: { 'Content-Type': 'application/json' }
  });
  
  expect([401, 404]).toContain(res.status);
});
