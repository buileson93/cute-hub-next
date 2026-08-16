# Plan - Fix Critical SSR 500 Error in Production

The production site `vatm.app` and the preview are experiencing a 500 error during Server-Side Rendering (SSR). This is likely caused by server-side code (loaders or top-level module code) attempting to access browser globals or perform unauthenticated database operations that fail in the Worker environment.

## User Review Required

> [!IMPORTANT]
> The current 500 error hides specific details. I will enable more verbose error reporting temporarily to diagnose the root cause if the preliminary fixes do not resolve it.

- Does the production environment have the `APP_SUPABASE_SERVICE_ROLE_KEY` secret set? (If using Lovable Cloud, this is managed automatically, but if it was manually overridden, it might be missing).

## Proposed Changes

### SSR & Error Handling
- **Enhanced Error Capture**: Update `src/lib/error-capture.ts` to ensure it captures all unhandled rejections and sync errors in the Worker environment.
- **Diagnostic Mode**: Modify `src/lib/error-page.ts` to show more environment context (safely) when an error occurs, helping identify missing environment variables.

### Data Fetching & Auth
- **Safe Loaders**: Audit all route loaders to ensure they don't perform database calls during SSR unless they are explicitly marked as server-safe or handle "Unauthorized" gracefully.
- **Backend Resolution**: Fix `src/integrations/backend/env.ts` to ensure `resolveServerBackend` doesn't throw if `SUPABASE_SERVICE_ROLE_KEY` is missing but only public access is needed.
- **Dashboard Restoration**: Ensure `src/routes/_app.index.tsx` (the main dashboard) properly handles the case where SSR is running without a session, providing fallback demo data or an empty state instead of crashing.

### Verification Plan
- **Local SSR Test**: Run a local production build to simulate the Worker environment and catch 500s.
- **Playwright Audit**: Use Playwright to check the production URL and verify the error page is replaced by the actual app.
- **Log Inspection**: Check server logs (if available via `stack_modern--server-function-logs`) for the specific exception causing the crash.
