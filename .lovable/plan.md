# Plan - Fix Truncation Issue in System Components Table (T51)

The user reported that the System Components table (`ThanhPhanTable`) is currently limited to 1,000 records, which contradicts previous agreements to handle larger datasets (like the 3,000+ rows discussed in T33/T30). 

## Analysis
- `ThanhPhanTable.tsx` uses `useThanhPhanRows` and `useTaiSanRows` hooks.
- These hooks call `supabase.rpc("rpc_thanh_phan_toan_cuc")` and `supabase.rpc("rpc_tai_san_toan_cuc")` respectively.
- By default, Supabase/PostgREST limits RPC results to 1,000 rows if not explicitly handled or if the server configuration has a hard limit (usually 1,000).
- Unlike tables, RPCs don't support standard pagination headers as easily in a loop without specific `OFFSET`/`LIMIT` parameters defined in the SQL function itself.
- However, the `rpc_thanh_phan_toan_cuc` is defined as `RETURNS SETOF jsonb`, which acts like a table, so standard `.range()` might work if the server allows it on the function result.
- If `.range()` is not supported directly on these RPCs, I may need to refactor them to support `p_limit` and `p_offset` parameters or switch to a `fetchAll` loop pattern similar to `src/routes/_app.he-thong.cay.tsx`.

## Proposed Changes

### 1. Database (Migrations)
- Update `rpc_thanh_phan_toan_cuc` and `rpc_tai_san_toan_cuc` to support pagination parameters (`p_limit`, `p_offset`) to ensure we can fetch more than 1,000 rows reliably if the standard `.range()` doesn't cut it.
- Alternatively, if `.range()` works on the existing functions, skip migration. (I will test with a script first).

### 2. Frontend (`src/components/mirats/ThanhPhanTable.tsx`)
- Implement a `fetchAll` loop for both `useThanhPhanRows` and `useTaiSanRows`.
- This ensures that all 800+ (and future 1000+) records are loaded into memory for the `StandardTable` to handle (which already has virtualization from T33).

## Technical Details
- Use a `for(;;)` loop with `.range(from, from + pageSize - 1)` inside the `queryFn`.
- Log warnings if data count is exactly a multiple of 1,000 to aid future debugging (consistent with T30 implementation).

## Verification Plan
- Run a `code--exec` script to verify if `supabase.rpc(...).range(...)` works on the current production-like environment.
- Verify `npx tsc --noEmit` is clean.
