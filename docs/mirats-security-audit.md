# MIRATS Security Review: Extension & API Implementation

## 1. Threat Model

### Threat: Stolen API Key
*   **Risk**: Unauthorized access to project correspondence and documents.
*   **Mitigation**:
    *   **Constant-time Verification**: `verifyApiKey` uses `timingSafeEqual` to prevent timing attacks.
    *   **HMAC-SHA256 Hashing**: Secrets are never stored in plaintext. Even a database leak doesn't expose the keys without the server-side pepper.
    *   **Scopes**: Keys are limited to specific actions (e.g., `project_correspondence:write`).
    *   **Revocation**: Instant revocation via `revoked_at`.
    *   **Audit Trail**: All uses are logged with `key_id` and hashed IP.
    *   **IP Binding**: `last_used_ip_hash` allows detecting anomalies or geographical shifts.

### Threat: Malicious Extension / Request Replay
*   **Risk**: Flooding the system with duplicate or malicious data.
*   **Mitigation**:
    *   **Idempotency**: `idempotency_key` ensures a retry doesn't create duplicate correspondence.
    *   **Strict Schema**: Zod validation at the API edge ensures only correctly formatted data enters.
    *   **Rate Limiting**: (Planned/Conceptual) Key-based rate limiting prevents brute force.
    *   **CORS**: `OPTIONS` handler allows specific origin controls.

### Threat: Project Enumeration / Privacy Leak
*   **Risk**: Attacker guesses project IDs to see if they exist.
*   **Mitigation**:
    *   **Privacy-First Errors**: The API returns `404 Not Found` for unauthorized project IDs instead of `403 Forbidden`, making it impossible to distinguish between a project that doesn't exist and one the user doesn't have access to.

### Threat: Malicious File Upload (PDF/Scan)
*   **Risk**: Server-side processing vulnerabilities or malware distribution.
*   **Mitigation**:
    *   **Signed URLs**: Short-lived TTL for storage access.
    *   **MIME/Extension Checks**: (Client-side and Storage policy) Only allowed types (PDF, images) are accepted.
    *   **DocViewer Hardening**: The UI only loads URLs from trusted origins (Supabase, Lovable, Localhost).

## 2. Audit Logging Specification

The system now implements a robust audit log in `public.api_audit_log`:

| Field | Storage Policy | Purpose |
| :--- | :--- | :--- |
| `key_id` | Public ID (Prefix) only | Identify the key without exposing secret |
| `user_id` | Foreign Key to auth.users | Link to owner |
| `action` | Enum/Text | `key_created`, `api_call`, `permission_denied`, etc. |
| `result` | success/failure | Track outcomes |
| `ip_hash` | SHA-256 of IP | Track source without storing PII |
| `metadata` | JSONB | Context (Project ID, scope required, etc.) |

## 3. Security Implementation Check

- [x] Constant-time secret comparison.
- [x] API key hashing with pepper.
- [x] RLS on `api_keys` and `api_audit_log`.
- [x] Audit log for key lifecycle and usage.
- [x] Idempotency enforcement.
- [x] CORS infrastructure.
- [x] Untrusted URL prevention in `DocViewerDialog`.
- [x] Generic 404s for enumeration prevention.
- [x] Privacy-preserving IP logging (hashing).

---
*Date of Audit: 2026-08-19*
*Auditor: MIRATS Security Guard*
