
-- ============================================================
-- T06 — NGUỒN CHUẨN FK/TEXT/JSONB
-- 1) View detector read-only phát hiện lệch giữa cột text legacy và FK chuẩn
-- 2) Bổ sung đồng bộ vi_tri text từ vi_tri_id trong trigger sync (chỉ khi ghi mới,
--    không backfill legacy vì trigger chỉ fire khi FK thay đổi)
-- Không UPDATE/DELETE dữ liệu.
-- ============================================================

-- 1) Detector view -------------------------------------------------
CREATE OR REPLACE VIEW public.v_thiet_bi_nguon_chuan_conflict AS
SELECT
  tb.id,
  tb.ma_thiet_bi,
  tb.ten_thiet_bi,
  -- model
  CASE WHEN tb.model_id IS NOT NULL AND tb.model IS NOT NULL AND btrim(tb.model) <> ''
            AND btrim(lower(tb.model)) <> btrim(lower(m.ten))
       THEN 'model_text_lech_fk' END AS c_model,
  tb.model  AS model_text,  m.ten AS model_fk,
  -- nha_san_xuat
  CASE WHEN tb.nha_san_xuat_id IS NOT NULL AND tb.nha_san_xuat IS NOT NULL AND btrim(tb.nha_san_xuat) <> ''
            AND btrim(lower(tb.nha_san_xuat)) <> btrim(lower(nsx.ten))
       THEN 'nsx_text_lech_fk' END AS c_nsx,
  tb.nha_san_xuat AS nsx_text, nsx.ten AS nsx_fk,
  -- nha_cung_cap
  CASE WHEN tb.nha_cung_cap_id IS NOT NULL AND tb.nha_cung_cap IS NOT NULL AND btrim(tb.nha_cung_cap) <> ''
            AND btrim(lower(tb.nha_cung_cap)) <> btrim(lower(ncc.ten))
       THEN 'ncc_text_lech_fk' END AS c_ncc,
  tb.nha_cung_cap AS ncc_text, ncc.ten AS ncc_fk,
  -- vi_tri
  CASE WHEN tb.vi_tri_id IS NOT NULL AND tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> ''
            AND btrim(lower(tb.vi_tri)) <> btrim(lower(vt.ten))
       THEN 'vitri_text_lech_fk'
       WHEN tb.vi_tri_id IS NULL AND tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> ''
       THEN 'vitri_text_khong_fk' END AS c_vitri,
  tb.vi_tri AS vitri_text, vt.ten AS vitri_fk,
  -- kế thừa từ model
  CASE WHEN tb.model_id IS NOT NULL AND tb.nha_san_xuat_id IS NOT NULL AND m.nha_san_xuat_id IS NOT NULL
            AND m.nha_san_xuat_id <> tb.nha_san_xuat_id
       THEN 'nsx_khong_ke_thua_model' END AS c_nsx_inherit,
  CASE WHEN tb.model_id IS NOT NULL AND tb.loai_thiet_bi_id IS NOT NULL AND m.loai_thiet_bi_id IS NOT NULL
            AND m.loai_thiet_bi_id <> tb.loai_thiet_bi_id
       THEN 'loai_khong_ke_thua_model' END AS c_loai_inherit
FROM public.thiet_bi tb
LEFT JOIN public.dm_model m         ON m.id   = tb.model_id
LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
LEFT JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
LEFT JOIN public.dm_vi_tri vt        ON vt.id  = tb.vi_tri_id
WHERE
     (tb.model_id IS NOT NULL AND tb.model IS NOT NULL AND btrim(tb.model) <> '' AND btrim(lower(tb.model)) <> btrim(lower(m.ten)))
  OR (tb.nha_san_xuat_id IS NOT NULL AND tb.nha_san_xuat IS NOT NULL AND btrim(tb.nha_san_xuat) <> '' AND btrim(lower(tb.nha_san_xuat)) <> btrim(lower(nsx.ten)))
  OR (tb.nha_cung_cap_id IS NOT NULL AND tb.nha_cung_cap IS NOT NULL AND btrim(tb.nha_cung_cap) <> '' AND btrim(lower(tb.nha_cung_cap)) <> btrim(lower(ncc.ten)))
  OR (tb.vi_tri_id IS NOT NULL AND tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> '' AND btrim(lower(tb.vi_tri)) <> btrim(lower(vt.ten)))
  OR (tb.vi_tri_id IS NULL AND tb.vi_tri IS NOT NULL AND btrim(tb.vi_tri) <> '')
  OR (tb.model_id IS NOT NULL AND tb.nha_san_xuat_id IS NOT NULL AND m.nha_san_xuat_id IS NOT NULL AND m.nha_san_xuat_id <> tb.nha_san_xuat_id)
  OR (tb.model_id IS NOT NULL AND tb.loai_thiet_bi_id IS NOT NULL AND m.loai_thiet_bi_id IS NOT NULL AND m.loai_thiet_bi_id <> tb.loai_thiet_bi_id);

GRANT SELECT ON public.v_thiet_bi_nguon_chuan_conflict TO authenticated;
GRANT SELECT ON public.v_thiet_bi_nguon_chuan_conflict TO service_role;

-- 2) Bổ sung đồng bộ vi_tri text từ vi_tri_id (chỉ khi FK thay đổi -> không backfill)
CREATE OR REPLACE FUNCTION public.thiet_bi_sync_ref_text()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.nha_san_xuat_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.nha_san_xuat_id IS DISTINCT FROM OLD.nha_san_xuat_id) THEN
    NEW.nha_san_xuat := (SELECT ten FROM public.dm_nha_san_xuat WHERE id = NEW.nha_san_xuat_id);
  END IF;

  IF NEW.nha_cung_cap_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.nha_cung_cap_id IS DISTINCT FROM OLD.nha_cung_cap_id) THEN
    NEW.nha_cung_cap := (SELECT ten FROM public.dm_nha_cung_cap WHERE id = NEW.nha_cung_cap_id);
  END IF;

  IF NEW.model_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.model_id IS DISTINCT FROM OLD.model_id) THEN
    NEW.model := (SELECT ten FROM public.dm_model WHERE id = NEW.model_id);
  END IF;

  IF NEW.vi_tri_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.vi_tri_id IS DISTINCT FROM OLD.vi_tri_id) THEN
    NEW.vi_tri := (SELECT ten FROM public.dm_vi_tri WHERE id = NEW.vi_tri_id);
  END IF;

  RETURN NEW;
END;
$function$;
