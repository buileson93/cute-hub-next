# Plan - Fix Runtime Error 500 on Home Page

The home page (`/`) is returning a 500 error during initial load (SSR). This is caused by the `loader` in `src/routes/_app.index.tsx` attempting to prefetch data using protected server functions (`getCompletenessStats`, `getCompletenessOverview`) before the user's session is established or propagated to the server.

## Proposed Changes

### 1. Fix Dashboard Loader
- Modify `src/routes/_app.index.tsx` to wrap the `ensureQueryData` calls in a try-catch block.
- This allows the page to render even if SSR prefetching fails due to missing authentication, letting the client-side authentication logic (`_app.tsx` and `useSession`) handle the redirect or re-fetch once the browser session is hydrated.

### 2. Update Server Functions Resilience
- Ensure that `getCompletenessStats` and `getCompletenessOverview` in `src/lib/mirats/completeness.functions.ts` don't cause fatal errors if called during SSR without a token, or handle the 401 gracefully in the loader.

### 3. Verify Other Loaders
- Briefly check other routes under `_app` that might have added loaders recently to ensure they don't share the same vulnerability.

## Technical Details
- The `requireSupabaseAuth` middleware in `src/integrations/backend/auth-middleware.ts` throws an error if no `Authorization` header is present.
- During SSR, this header is missing because the session is stored in `localStorage` and not automatically sent to the server.
- The `errorMiddleware` in `src/start.ts` catches this error and returns a 500 response.

## Verification Plan
- Build the project locally and check if the index route loads without a 500 error.
- Use a preview script to verify that the home page (or the auth redirect) renders correctly.
