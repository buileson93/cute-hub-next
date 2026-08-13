# Plan: Fix Device Detail Link and Page Layout

The user reported an error when clicking on a specific device link (`/thiet-bi/TB_8XPGME8S`). Based on the codebase analysis, the link is correctly formed for a TanStack Router project using a path parameter `$maThietBi`. However, the page might be failing due to missing data propagation, layout issues (like `PageBody` height), or a mismatch in how `maThietBi` is used in the query.

## Proposed Changes

### 1. Fix Route Parameter Sync in `ThietBiDetailRoute`
- The current implementation of `src/routes/_app.thiet-bi.$maThietBi.tsx` uses `Route.useParams()`.
- I will ensure that the parameter extraction and the `useQuery` key are perfectly synchronized.
- I will add a `useEffect` to ensure that if the parameter changes, the component reacts correctly (TanStack Router usually handles this, but a manual verification of the `ma` variable usage is needed).

### 2. Fix Layout Propagation (Height Issues)
- Similar to previous "0px height" issues in the MindMap, the `PageBody` in the device detail page might be collapsing if it's not receiving proper flex context from its parent or if the container height isn't explicitly defined.
- I will ensure `PageBody` in `src/routes/_app.thiet-bi.$maThietBi.tsx` has `className="flex-1"` if needed, and verify the top-level container has `min-h-screen`.

### 3. Data Integrity & Fallback
- If the device `TB_8XPGME8S` exists in the database but the query fails to return it (or returns `null`), I will add more descriptive error handling to identify if it's a "Not Found" error or a "Permission/RPC" error.
- Check `loai:loai_thiet_bi_id(ten, mau)` etc. in the query to ensure that if a relation is missing, the whole query doesn't fail.

### 4. Fix Redundant Breadcrumbs/Navigation
- The user previously mentioned redundant links. I will check the `PageHeader` in the detail page to ensure it's not duplicating breadcrumbs from the `TopBar`.

## Technical Details
- **Files to modify:**
  - `src/routes/_app.thiet-bi.$maThietBi.tsx`: Fix parameter handling, query resilience, and layout.
- **RPC/Supabase:** Ensure the `.eq("ma_thiet_bi", ma)` is correctly targeting the column (it should be `ma_thiet_bi` based on the code).

## Verification Plan
1. **Manual Navigation**: Try to navigate to `/thiet-bi/TB_8XPGME8S`.
2. **Layout Check**: Use browser tools (if available) or verify via screenshots that the page content is visible and not 0px high.
3. **Data Check**: Verify that `tb` object is correctly populated and passed to `TabTongQuan`.
