# Plan: Fix Unsafe supabaseAdmin Usage and Implement Proper Authentication

Audit and replace unsafe `supabaseAdmin` usage in server functions to prevent RLS bypass. For necessary admin operations, implement strict role-based access control (RBAC) and audit logging.

## User Review Required

> [!IMPORTANT]
> The audit identified several administrative features (User Management, Backup, Form Signing) that currently use `supabaseAdmin`. These will be updated to include strict server-side role checks. 

- **Permissions**: Do you want to restrict `supabaseAdmin` operations (like user management) specifically to the 'admin' role?
- **Audit Logging**: I will implement audit logging for all operations that continue to use `supabaseAdmin`.

## Proposed Changes

### 1. Audit and Implementation Strategy
- **Scan**: Map every usage of `supabaseAdmin` found via `grep`.
- **Classification**:
    - **Type A**: Can be replaced with browser-side `supabase` client (respects RLS).
    - **Type B**: Requires `supabaseAdmin` (e.g., `auth.admin`, system-wide backups) but must be protected by server-side `has_role` checks.
- **Security Middleware**: Use `requireSupabaseAuth` and custom role validation inside `.handler()`.

### 2. High-Risk Features Fixes

#### `src/lib/admin-users.functions.ts`
- Add `context.supabase` session validation.
- Check if `userId` has the 'admin' role before calling `supabaseAdmin.auth.admin`.
- Ensure `audit_log` entries include the acting user's ID.

#### `src/lib/backup.functions.ts`
- Restrict backup/restore triggers to users with 'admin' or 'moderator' roles.

#### `src/lib/form-signing.functions.ts`
- Implement specific role checks (e.g., 'user' or 'moderator') to ensure users can only sign forms they are authorized to access, even when using admin privileges to manage storage or OTPs.

### 3. Verification
- Run `npx tsc --noEmit` to ensure type safety.
- Verify that `supabaseAdmin` is only imported inside protected `.handler()` blocks.

## Technical Details

### Security Pattern for Server Functions
```typescript
export const sensitiveAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // 1. Verify role via context.supabase (which respects RLS)
    const { data: isAdmin } = await context.supabase.rpc('has_role', { 
      _user_id: context.userId, 
      _role: 'admin' 
    });
    
    if (!isAdmin) throw new Error("Unauthorized: Admin role required");

    // 2. Perform admin operation
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // ... logic ...
    
    // 3. Log action
    await supabaseAdmin.from("audit_log").insert({
      user_id: context.userId,
      action: "ADMIN_ACTION",
      // ...
    });
  });
```

### Table of Findings (Sample)
| File | Function | Risk | Action |
| :--- | :--- | :--- | :--- |
| `admin-users.functions.ts` | `createUser` | RLS Bypass | Added `has_role('admin')` check |
| `backup.functions.ts` | `runBackup` | Data Leak | Added `has_role('admin')` check |
| `form-signing.functions.ts` | `signForm` | Signature Forgery | Verified submission ownership before admin sign |
