# Plan - MIRATS API Key System for Browser Extension

Implement a secure, scoped API key system allowing the MIRATS Browser Extension to connect safely without using raw Supabase keys or shared plaintext credentials.

## User Review Required

> [!IMPORTANT]
>
> - The API key will be displayed **only once** upon creation.
> - The secret is hashed using SHA-256 with a server-side pepper (stored in secrets).
> - Rate limiting will be applied per key/user to prevent abuse.

## Proposed Changes

### 1. Database Schema (Supabase)

- **`api_keys` Table**:
  - `id` (UUID, Primary Key)
  - `key_id` (Text, Unique, public identifier: `mrt_ext_live_<keyId>_...`)
  - `secret_hash` (Text, HMAC/SHA-256 hash)
  - `name` (Text, user-friendly name)
  - `user_id` (UUID, references `auth.users`)
  - `scopes` (Text Array: `projects:read`, `project_documents:write`, etc.)
  - `expires_at` (Timestamp)
  - `last_used_at` (Timestamp)
  - `revoked_at` (Timestamp)
  - `created_at` (Timestamp)
- **`api_key_project_scopes` Table**: (Optional/Future-proof)
  - `api_key_id` (UUID)
  - `project_id` (UUID)
  - Permissions: `can_read`, `can_upload`, etc.

### 2. Backend Logic (Server Functions & Routes)

- **Key Generation**:
  - Use `crypto.getRandomValues` for a 32-byte secret.
  - Format: `mrt_ext_live_<keyId>_<secret>`.
  - Store only the hash of `secret` combined with a `MIRATS_API_PEPPER`.
- **Auth Middleware**:
  - Extract `keyId` and `secret` from `Authorization: Bearer <token>`.
  - Constant-time comparison of the secret hash.
  - Validate `revoked_at`, `expires_at`, and requested `scopes`.
- **API Endpoint Update**:
  - Refactor `src/routes/api/public/ext/cong-van.ts` to use the new dynamic API key verification instead of the static environment variable check.

### 3. Frontend UI (Astryx Design)

- **Integration Page**: Create `src/routes/_app.admin.tich-hop.tsx` (or integrated into existing Admin workspace).
- **Key Management UI**:
  - List active keys (prefix/last4, scopes, last used).
  - "Create New Key" dialog with scope selection and name.
  - One-time display of the full token with a copy button.
  - Revoke/Delete actions.

## Technical Details

- **Security**:
  - `HMAC-SHA256(secret, pepper)` for storage.
  - Constant-time hash comparison to prevent timing attacks.
  - Scopes strictly enforced at the middleware level.
- **Rate Limiting**: Implementation of a basic sliding window or bucket algorithm in the API route.
- **Audit Logging**: Automatic event logging to `du_an_su_kien` or a dedicated audit table when keys are used/managed.

## Verification Plan

### Automated Tests

- `api-key-auth.test.ts`: Verify valid/invalid tokens, expired tokens, revoked tokens, and scope violations.
- `api-key-hashing.test.ts`: Ensure hashes are stored correctly and cannot be reversed easily.

### Manual Verification

1. Navigate to Settings -> Integrations -> Browser Extension.
2. Create a new key with `projects:read` scope.
3. Attempt to call the `/api/public/ext/cong-van` endpoint using the generated key via `curl`.
4. Verify success.
5. Revoke the key and verify that subsequent calls fail with 401 Unauthorized.
