# Runtime Error Fix Plan (500 on getAiPublicConfig)

Investigating and fixing the 500 error occurring when the application calls `getAiPublicConfig`. This is a critical error that causes a blank screen as it's triggered during early app initialization (AI Chat/Command Palette).

## Problem Analysis

The `getAiPublicConfig` server function fails with a 500 Internal Server Error.
Current implementation in `src/lib/ai/config.functions.ts`:

```typescript
export const getAiPublicConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_ai_public_config");
    if (error) throw new Error(error.message);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      enabled: (row?.enabled as boolean) ?? false,
      model: (row?.model as string) ?? "",
      beta_label: (row?.beta_label as string) ?? "Beta",
    };
  });
```

Possible failure modes:

1. **Middleware Failure**: `requireSupabaseAuth` might be failing before the handler is reached. The middleware uses `context.supabase.auth.getClaims(token)`.
2. **RPC Failure**: The RPC `get_ai_public_config` might be failing due to missing permissions or unexpected data structure.
3. **Context Injection**: The `supabase` client in `context` might not be correctly initialized in the middleware for some edge cases.
4. **Prerender/SSR mismatch**: If this is called during SSR without a session, it might trigger the 500 if the middleware doesn't handle unauthenticated states gracefully (though it seems to return a null user).

## Proposed Fixes

### 1. Robust getAiPublicConfig Handler

- Add try-catch block inside the handler to prevent unhandled exceptions.
- Provide safer fallback values if data is missing or malformed.
- Check if `context.supabase` is available before calling RPC.

### 2. Middleware Audit

- Review `src/integrations/backend/auth-middleware.ts` to ensure it doesn't throw raw errors that result in 500s when tokens are missing or invalid, especially during hydration.

### 3. Client-side Resilience

- Update `AiChatButton.tsx` and `CommandPalette.tsx` to handle potential 500 errors from the server function without breaking the UI.

## Implementation Steps

1. **Refactor `src/lib/ai/config.functions.ts`**:
   - Add error handling and logging (via `reportLovableError`).
   - Simplify data extraction from RPC.
2. **Verify `get_ai_public_config` Grants**:
   - Ensure the RPC has `GRANT EXECUTE` to `authenticated` (and `anon` if needed, though middleware currently requires auth).

3. **Update `src/components/mirats/AiChatButton.tsx` and `CommandPalette.tsx`**:
   - Ensure they don't crash if `cfg` is undefined or the query fails.
