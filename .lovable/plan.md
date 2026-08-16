# Plan - Fix SSR 500 Errors and Astryx Integration

The user is reporting a persistent 500 error in the preview environment, specifically suspecting that the integration of the Astryx library might be causing issues. Previous diagnostics show that while the local dev server (Node.js) works, the preview environment (Cloudflare Workers) fails, likely due to SSR-unsafe code or environment variable access patterns.

## User Review Required

> [!IMPORTANT]
> The current 500 error is likely caused by the server trying to execute code that only works in a web browser, or by missing server-side configuration for the new "Astryx" design system.

- Do you have any specific error logs from the "View Details" section of the 500 page that you haven't shared yet?
- Did the 500 error start immediately after the first Astryx component was added, or after the `AstryxProvider` was wrapped around the whole app?

## Proposed Changes

### SSR Stability
- **Fix Environment Variable Access**: Audit `src/integrations/backend/env.ts` and other server-side files to ensure `process.env` is handled safely in Workers environments, using fallbacks to `import.meta.env` where appropriate.
- **SSR-Safe Astryx Integration**: Wrap the `AstryxProvider` or specific Astryx components with a hydration check (using `useHydrated` or `useEffect`) if they access browser-only globals (window/document) during initial render.
- **Robust Error Boundary**: Enhance `src/server.ts` to capture and display more detailed error information specifically for Worker-related failures.

### Backend & Auth Sync
- **Unified Backend Logic**: Ensure `resolveServerBackend` correctly identifies the backend provider (Lovable Cloud vs. Self-hosted) to prevent 401/500 errors during data fetching.
- **SSR Data Safety**: Audit loaders in `src/routes/_app.index.tsx` and `src/routes/_app.he-thong.cay.tsx` to ensure they don't trigger database calls that require a client-side session during the server-side render phase.

### Astryx Polish
- **Token Consistency**: Verify that the `vatm` theme tokens in `src/styles/theme-vatm.ts` match the Astryx system requirements to prevent style-related crashes or flickering.
- **Component Audit**: Scan for legacy UI components that might be conflicting with the new Astryx layout system.

## Verification Plan

### Automated Tests
- **Playwright SSR Check**: Run a script to visit the preview URL and detect if the 500 error page is rendered.
- **Console Log Audit**: Capture server-side logs to identify the exact line triggering the `ReferenceError` or `TypeError`.

### Manual Verification
- Check the dashboard and system tree pages in the preview to ensure they load without the "Hệ thống gặp lỗi nghiêm trọng" screen.
- Verify that the theme colors and fonts (Space Grotesk, Inter) are correctly applied.
