# Plan: Secure Privileged Public Hooks

Secure public API endpoints used for cron jobs and maintenance against unauthorized access and privilege escalation.

## User Review Required

> [!IMPORTANT]
> - This plan requires `CRON_SECRET` and `TEST_EMAIL_SECRET` to be set in the environment.
> - `test-email-alerts` will be restricted to `buileson93@gmail.com` or a predefined allowlist.

## Proposed Changes

### 1. API Security Utility
- Create `src/lib/api-security.server.ts` providing:
    - `verifyCronSecret(request: Request, secretEnvName?: string)`: Constant-time validation.
    - `checkIdempotency(key: string, expirySeconds?: number)`: Basic cache-based guard (if possible) or at least checking the header.
    - `auditApiCall(endpoint: string, outcome: string, metadata: object)`: Consistent logging to `audit_log`.

### 2. Secure Endpoints
Update the following files to use the new security utility:
- `src/routes/api/public/hooks/test-email-alerts.ts`
    - Add `TEST_EMAIL_SECRET` check.
    - Restrict `to` email to allowlist.
    - Disable in production unless `ENABLE_TEST_EMAIL` is true.
- `src/routes/api/public/hooks/pm-generate.ts`
    - Replace open access with `CRON_SECRET` requirement.
- `src/routes/api/public/hooks/scan-canh-bao.ts`
    - Replace open access with `CRON_SECRET` requirement.
- `src/routes/api/public/hooks/r2-cleanup.ts`
    - Remove `apikey` (anon key) fallback. Require `CRON_SECRET`.
- `src/routes/api/public/hooks/reliability-report.ts`
    - Remove `apikey` (anon key) fallback. Require `CRON_SECRET`.

### 3. Verification & Guardrails
- **Integration Tests**: Implement `src/components/mirats/__tests__/api-security.test.ts` to verify 401/404 responses for all unauthorized scenarios.
- **Audit Logs**: Ensure outcome and request ID are logged without exposing secrets.

## Technical Details
- Use `crypto.timingSafeEqual` for all secret comparisons.
- Return `404 Not Found` if a secret is not configured to hide the endpoint's existence to unauthorized scanners.
- Return `401 Unauthorized` for provided but incorrect secrets.
- Integration tests will be run via `vitest`.

## Verification Plan

### Automated Tests
- Run `npm test src/components/mirats/__tests__/api-security.test.ts`
- Expect 100% pass rate.

### Manual Verification
- Attempt to call endpoints via `curl` without headers -> Expect 404/401.
- Attempt to call with `apikey` (anon key) -> Expect 401.
- Call with correct `CRON_SECRET` -> Expect 200.
