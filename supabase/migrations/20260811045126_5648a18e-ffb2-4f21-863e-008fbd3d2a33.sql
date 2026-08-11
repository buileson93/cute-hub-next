
-- Migration: Create view_ton_kho_model to bridge Inventory and Assets
-- Purpose: Answer "How many replacements (serial or bulk) are available for this model?"

CREATE OR REPLACE VIEW public.view_ton_kho_model AS
WITH 
asset_stock AS (
  -- Count assets (thiet_bi) available for each model
  SELECT 
    model_id,
    count(*) filter (where vai_tro = 'he_thong') as count_system,
    count(*) filter (where vai_tro = 'ccdc') as count_ccdc,
    count(*) filter (where vai_tro = 'vat_tu') as count_spare,
    count(*) as total_serial_count
  FROM public.thiet_bi
  WHERE trang_thai_id IN (
    -- Assuming 'san_sang' (Ready) status IDs. Need to be dynamic or use text status.
    -- For now, filtering where it's NOT installed in gan_chuc_nang is safer.
    SELECT id FROM public.thiet_bi 
    WHERE id NOT IN (SELECT thiet_bi_id FROM public.gan_chuc_nang WHERE den_ngay IS NULL)
  )
  GROUP BY model_id
),
inventory_stock AS (
  -- Sum bulk inventory (vat_tu) available for each model
  -- Using v_ton_kho logic but grouped by model_id
  SELECT 
    vt.model_id,
    sum(g.hieu_ung) as total_bulk_quantity
  FROM public.vat_tu vt
  JOIN public.kho_giao_dich g ON vt.id = g.vat_tu_id
  GROUP BY vt.model_id
)
SELECT 
  m.id as model_id,
  m.ten as model_ten,
  COALESCE(as_stk.count_system, 0) as serial_system,
  COALESCE(as_stk.count_ccdc, 0) as serial_ccdc,
  COALESCE(as_stk.count_spare, 0) as serial_spare,
  COALESCE(as_stk.total_serial_count, 0) as serial_total,
  COALESCE(inv_stk.total_bulk_quantity, 0) as bulk_quantity,
  (COALESCE(as_stk.total_serial_count, 0) + COALESCE(inv_stk.total_bulk_quantity, 0)) as combined_total
FROM public.dm_model m
LEFT JOIN asset_stock as_stk ON m.id = as_stk.model_id
LEFT JOIN inventory_stock inv_stk ON m.id = inv_stk.model_id;

GRANT SELECT ON public.view_ton_kho_model TO authenticated;
GRANT SELECT ON public.view_ton_kho_model TO anon;
