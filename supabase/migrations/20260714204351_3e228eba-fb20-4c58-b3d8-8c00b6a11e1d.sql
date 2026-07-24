-- ============ mv_ton_kho_tong ============
DROP MATERIALIZED VIEW IF EXISTS public.mv_ton_kho_tong CASCADE;
CREATE MATERIALIZED VIEW public.mv_ton_kho_tong AS
SELECT
  g.vat_tu_id,
  g.kho_id,
  g.don_vi_id,
  vt.ten           AS ten_vat_tu,
  vt.ma_vat_tu,
  vt.loai,
  vt.don_vi_tinh,
  vt.muc_ton_toi_thieu,
  k.ten            AS ten_kho,
  SUM(g.hieu_ung)  AS ton_kho,
  MAX(g.created_at) AS lan_giao_dich_cuoi
FROM public.kho_giao_dich g
JOIN public.vat_tu vt ON vt.id = g.vat_tu_id
JOIN public.kho   k   ON k.id  = g.kho_id
GROUP BY g.vat_tu_id, g.kho_id, g.don_vi_id, vt.ten, vt.ma_vat_tu, vt.loai, vt.don_vi_tinh, vt.muc_ton_toi_thieu, k.ten;

CREATE UNIQUE INDEX mv_ton_kho_tong_pk
  ON public.mv_ton_kho_tong (vat_tu_id, kho_id, COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX mv_ton_kho_tong_kho ON public.mv_ton_kho_tong (kho_id);
CREATE INDEX mv_ton_kho_tong_donvi ON public.mv_ton_kho_tong (don_vi_id);

GRANT SELECT ON public.mv_ton_kho_tong TO authenticated;
GRANT ALL    ON public.mv_ton_kho_tong TO service_role;

-- ============ mv_kpi_bao_tri ============
DROP MATERIALIZED VIEW IF EXISTS public.mv_kpi_bao_tri CASCADE;
CREATE MATERIALIZED VIEW public.mv_kpi_bao_tri AS
SELECT
  cv.don_vi_id_snapshot AS don_vi_id,
  dv.ten                AS don_vi_ten,
  COUNT(*)                                                                             AS tong_cong_viec,
  COUNT(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH')                                 AS da_hoan_thanh,
  COUNT(*) FILTER (WHERE cv.trang_thai IN ('MO','DANG_LAM'))                           AS dang_mo,
  COUNT(*) FILTER (WHERE cv.trang_thai IN ('MO','DANG_LAM')
                      AND cv.ngay_den_han < CURRENT_DATE)                              AS qua_han,
  COUNT(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH'
                      AND cv.ngay_hoan_thanh <= cv.ngay_den_han)                       AS hoan_thanh_dung_han,
  ROUND(100.0 * COUNT(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH'
                                    AND cv.ngay_hoan_thanh <= cv.ngay_den_han)::numeric
              / NULLIF(COUNT(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH'), 0)::numeric,
        1)                                                                             AS ty_le_dung_han,
  NOW()                                                                                AS tinh_luc
FROM public.cong_viec_bao_tri cv
LEFT JOIN public.dm_don_vi dv ON dv.id = cv.don_vi_id_snapshot
GROUP BY cv.don_vi_id_snapshot, dv.ten;

CREATE UNIQUE INDEX mv_kpi_bao_tri_pk
  ON public.mv_kpi_bao_tri (COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid));

GRANT SELECT ON public.mv_kpi_bao_tri TO authenticated;
GRANT ALL    ON public.mv_kpi_bao_tri TO service_role;

-- ============ refresh function ============
CREATE OR REPLACE FUNCTION public.refresh_mv_tonghop()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Chỉ admin hoặc service_role được gọi
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin được refresh materialized view';
  END IF;

  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_ton_kho_tong;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_kpi_bao_tri;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_mv_tonghop() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_mv_tonghop() TO authenticated;

-- Populate lần đầu (không CONCURRENTLY vì matview trống)
REFRESH MATERIALIZED VIEW public.mv_ton_kho_tong;
REFRESH MATERIALIZED VIEW public.mv_kpi_bao_tri;