---
name: SSR Stabilization & Login Fix
description: Plan to fix persistent SSR 500 errors caused by DOM access and resolve technician login issues.
type: feature
---

## Goals
1. Resolve persistent HTTP 500 errors in production/preview SSR.
2. Fix login failures for technicians (tranquangvinh, nguyenluonggiam).
3. Ensure Astryx integration is fully SSR-safe.

## Proposed Changes

### 1. SSR & DOM Safety
- **src/server.ts**: Enhance DOM shims. The recursive Proxy might be too aggressive or missing specific properties that libraries expect (e.g., `window.location.href`, `navigator.userAgent`).
- **AstryxProvider.tsx**: Implement a strict "Gate" that prevents ANY Astryx-related code from executing during SSR. We will render a semantic skeleton or a simple `children` wrapper without the `AstryxTheme` until hydration.

### 2. Login & Auth Flow
- **Audit `src/integrations/backend/client.ts`**: Verify why technicians can't log in. It might be related to the `mirats.backend.override` logic causing mismatches between the auth session and the client configuration.
- **Trigger Profiles Sync**: Ensure the `handle_new_user` trigger is healthy. I will create a one-time migration to ensure all existing technicians have correct `ho_ten` and `email` in the `profiles` table.

### 3. Environment Stability
- **src/integrations/backend/env.ts**: Ensure environment variables are read safely across all environments (Local, Preview, Production Workers).

## Technical Details
- Use `isHydrated` state in `AstryxProvider` to defer `AstryxTheme` mounting.
- Add `window.location` and `window.history` shims in `src/server.ts`.
- Run a Supabase query to verify `auth.users` vs `public.profiles` consistency for the specific technicians.
