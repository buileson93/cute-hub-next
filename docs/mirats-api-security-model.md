# MIRATS Security & Threat Model: External API & Browser Extension

## 1. Scope

This document covers the security architecture for the MIRATS Browser Extension and its associated server-side APIs.

## 2. Threat Model

### T1: API Key Theft

- **Vector**: Key leaked via frontend logs, git commits, or physical access.
- **Mitigation**:
  - One-time secret display at creation.
  - HMAC-SHA256 storage (peppered).
  - Mandatory expiration and easy revocation.
  - Last-used IP hashing for anomaly detection.

### T2: Project Enumeration

- **Vector**: Brute-forcing project UUIDs to check existence.
- **Mitigation**:
  - API returns generic `404 Not Found` for projects that don't exist OR the user lacks access to.
  - Rate limiting per Key ID.

### T3: Malicious File Upload

- **Vector**: Uploading non-PDF files or PDFs with embedded scripts.
- **Mitigation**:
  - Strict MIME type enforcement.
  - Filename sanitization to prevent path traversal.
  - Short-lived Signed URLs for storage access.

### T4: Request Replay

- **Vector**: Re-sending a valid upload request to create duplicate records.
- **Mitigation**:
  - Mandatory `idempotency_key` (UUID) for all write operations.

## 3. RLS Policy Summary

| Table            | Policy                         | Role          |
| :--------------- | :----------------------------- | :------------ |
| `api_keys`       | `auth.uid() = user_id`         | authenticated |
| `api_audit_log`  | `auth.uid() = user_id`         | authenticated |
| `du_an_cong_van` | `has_project_access(du_an_id)` | authenticated |

---

_Last Updated: 2026-08-19_
