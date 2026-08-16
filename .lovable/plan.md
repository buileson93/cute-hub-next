---
name: Emergency 500 Error Restoration
description: Restore standard error handling and fix root causes of server-side 500 errors.
type: feature
---

## Context
The application is experiencing a critical 500 error, triggered when server functions or SSR processes encounter unhandled exceptions or environment mismatches. The current implementation uses a custom `renderErrorPage` in `src/lib/error-page.ts` which provides diagnostic information.

## Identified Issues
1.  **Environment Mismatch**: `src/integrations/backend/env.ts` uses `import.meta.env` which is not available in server functions or Node-based SSR environments.
2.  **SSR Incompatibilities**: Some components or hooks may be calling browser-only APIs without proper guards.
3.  **Missing Global Error Logic**: `src/start.ts` and `src/server.ts` use `renderErrorPage()` but it needs to be robust against "Unknown error" scenarios.

## Implementation Plan

### 1. Robust Environment Resolution
Update `src/integrations/backend/env.ts` to safely handle environment variables in both browser and server runtimes without relying strictly on `import.meta.env` inside the `resolveServerBackend` function.

### 2. SSR Error Isolation
- Review `src/start.ts` to ensure `errorMiddleware` correctly captures and formats errors.
- Ensure `src/lib/error-page.ts` provides useful debugging information for "Unknown error" types.

### 3. Server Function Hardening
- Audit `src/lib/ai/config.functions.ts` and `src/lib/mirats/completeness.functions.ts` to ensure they don't crash the entire request if a dependency fails.
- Add try/catch wrappers to critical SSR loaders.

### 4. Verification
- Run a production build (`bun run build`).
- Verify the preview at `http://localhost:8080/`.
- Inspect the diagnostic output if the 500 page still appears.
