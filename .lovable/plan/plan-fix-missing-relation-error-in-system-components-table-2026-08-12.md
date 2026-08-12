# Plan: Fix Missing Relation Error in System Components Table

The System Components table (`/he-thong/thanh-phan`) is currently failing with a `500 Internal Server Error` because the underlying RPC `rpc_thanh_phan_toan_cuc` references a non-existent table `thiet_bi_thanh_phan`. This table name is a hallucination or incorrect reference; the actual table containing system components is `he_thong_thanh_phan`.

## Proposed Changes

### Database Migration
1. **Fix `rpc_thanh_phan_toan_cuc`**:
   - Create a new migration to redefine the function.
   - Replace the incorrect table name `thiet_bi_thanh_phan` with the correct one: `he_thong_thanh_phan`.
   - Ensure the `JOIN` logic correctly links `he_thong_thanh_phan` to `gan_chuc_nang` (to get the assigned asset/equipment) and then to the `thiet_bi` table.
   - Maintain the `modelId` and other metadata fields required for the `EntityHoverCard` feature (T41).
   - Fix column name references (e.g., `ten_thanh_phan` vs `ten`).

## Technical Details

### SQL Definition Fix
```sql
CREATE OR REPLACE FUNCTION public.rpc_thanh_phan_toan_cuc()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', tp.id,
      'ma', tp.ma_thanh_phan,
      'ten', tp.ten,
      'nhomHeThong', nht.ten,
      'phanLoai', pl.ten,
      'heThong', ht.ten,
      'heThongId', tp.he_thong_id,
      'viTriId', tp.vi_tri_id,
      -- ... other fields ...
      'daLap', (gcn.thiet_bi_id IS NOT NULL),
      'soThanhPhanCuaTaiSan', (SELECT count(*)::int FROM gan_chuc_nang g2 WHERE g2.thiet_bi_id = gcn.thiet_bi_id AND g2.den_ngay IS NULL),
      -- ... asset fields from thiet_bi ...
    )
  FROM he_thong_thanh_phan tp
  JOIN dm_he_thong ht ON ht.id = tp.he_thong_id
  JOIN dm_nhom_he_thong nht ON nht.id = ht.nhom_he_thong_id
  -- ... correct joins ...
  LEFT JOIN gan_chuc_nang gcn ON gcn.thanh_phan_id = tp.id AND gcn.den_ngay IS NULL
  LEFT JOIN thiet_bi t ON t.id = gcn.thiet_bi_id;
END;
$function$;
```

## Verification Plan
1. **Database Check**: Run the migration and manually test the RPC via `psql` to ensure it returns valid JSON without errors.
2. **UI Check**: Navigate to the System Components page in the preview and verify that the table loads correctly and data is displayed.
3. **Type Check**: Run `npx tsc --noEmit` to ensure no regressions in TypeScript types (though this is an RPC change, the returned shape must match expectations).
