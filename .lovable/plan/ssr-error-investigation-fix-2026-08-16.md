---
name: SSR Error Investigation & Fix
description: Plan to identify and fix the reported SSR error following Phase 5 completion.
type: feature
---

# SSR Error Investigation & Fix

The user reported an SSR error after completing Phase 5 (Component Lab). This plan focuses on identifying the root cause and implementing a fix to ensure stable server-side rendering for Astryx components.

## Diagnostic Steps

1. **Verify the error**: Although `bun run build:dev` passed, hydration errors or runtime SSR failures (500) might occur during actual rendering in the Worker environment.
2. **Check Pilot Routes**: Manually check `/admin/ui-kit` and other routes recently touched.
3. **Inspect Browser Console**: Look for "Hydration Mismatch" warnings which often indicate SSR issues.
4. **Inspect Worker Logs**: If a 500 error occurs, check the server-side logs for stack traces.

## Potential Causes

- **Browser Globals**: A component might be accessing `window`, `document`, or `navigator` at module scope or during the initial render.
- **Hydration Mismatch**: Random IDs, dates, or browser-specific state (like `matchMedia` or `localStorage`) used in the initial render.
- **Dynamic Imports**: Components intended for the browser only might need to be wrapped in `<ClientOnly>` or dynamically imported.
- **CSS Resolution**: P2/P3 changes to `@import` paths might cause issues in certain environments if not fully qualified.

## Implementation Tasks

### 1. Identify Failing Component

- Use the `admin.ui-kit.tsx` as a testbed. Comment out sections one by one to isolate the failing component.
- Check `Icon` component specifically, as it often involves complex loading logic.

### 2. Apply SSR Fixes

- **Global Guards**: Add `if (typeof window === 'undefined') return null;` where appropriate, or move side-effects to `useEffect`.
- **ClientOnly Wrapper**: Use the existing `<ClientOnly>` component for any leaf components that are strictly browser-dependent.
- **Deterministic State**: Ensure any state used in the first render is the same on server and client.

### 3. Verification

- Run `bun run build:dev` to ensure it still compiles.
- Test the preview at `http://localhost:8080/admin/ui-kit`.
- Verify no hydration warnings in the console.

## Technical Details

- **Environment**: TanStack Start v1 (Nitro/Cloudflare Worker).
- **Library**: `@astryxdesign/core` 0.4.1.
- **Constraints**: No use of `process.env` outside of server handlers.
