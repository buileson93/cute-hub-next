-- ============================================================================
-- T24 — Mở rộng scope chính sách bảo dưỡng + ghim template_version vào phiếu.
-- ============================================================================

-- 1) Mở rộng scope cho chính sách bảo dưỡng
ALTER TABLE public.bao_tri_chinh_sach
  ADD COLUMN IF NOT EXISTS he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.dm_model(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thiet_bi_id uuid REFERENCES public.thiet_bi(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_version_id uuid REFERENCES public.form_template_version(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bao_tri_cs_he_thong ON public.bao_tri_chinh_sach(he_thong_id) WHERE he_thong_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bao_tri_cs_model ON public.bao_tri_chinh_sach(model_id) WHERE model_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bao_tri_cs_thiet_bi ON public.bao_tri_chinh_sach(thiet_bi_id) WHERE thiet_bi_id IS NOT NULL;

-- 2) Ghim template_version vào phiếu công việc
ALTER TABLE public.cong_viec_bao_tri
  ADD COLUMN IF NOT EXISTS template_version_id uuid REFERENCES public.form_template_version(id) ON DELETE SET NULL;

-- 3) Scheduler: khớp scope + đóng dấu version (giữ chữ ký + tính idempotent)
CREATE OR REPLACE FUNCTION public.tao_cong_viec_bao_tri_dinh_ky()
 RETURNS TABLE(so_phieu_tao integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền tạo phiếu công việc bảo dưỡng';
  END IF;

  WITH ung_vien AS (
    SELECT t.id AS thiet_bi_id,
           t.he_thong_id,
           cs.id AS chinh_sach_id,
           cs.template_version_id,
           COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE) AS ngay_den_han
    FROM public.thiet_bi t
    JOIN public.bao_tri_chinh_sach cs
      ON cs.active = true
     AND (cs.loai_thiet_bi_id IS NULL OR cs.loai_thiet_bi_id = t.loai_thiet_bi_id)
     AND (cs.he_thong_id     IS NULL OR cs.he_thong_id     = t.he_thong_id)
     AND (cs.model_id        IS NULL OR cs.model_id        = t.model_id)
     AND (cs.thiet_bi_id     IS NULL OR cs.thiet_bi_id     = t.id)
     AND (cs.loai_thiet_bi_id IS NOT NULL OR cs.he_thong_id IS NOT NULL
          OR cs.model_id IS NOT NULL OR cs.thiet_bi_id IS NOT NULL)
    WHERE t.thoi_diem_cham_dut IS NULL
      AND COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE)
          <= CURRENT_DATE + COALESCE(cs.canh_bao_truoc_ngay, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.cong_viec_bao_tri cv
        WHERE cv.thiet_bi_id = t.id
          AND cv.chinh_sach_id = cs.id
          AND cv.trang_thai IN ('MO','DANG_LAM')
      )
  )
  INSERT INTO public.cong_viec_bao_tri
    (thiet_bi_id, he_thong_id, chinh_sach_id, template_version_id, loai, trang_thai, ngay_den_han, ky_han, mo_ta)
  SELECT thiet_bi_id, he_thong_id, chinh_sach_id, template_version_id, 'PM', 'MO', ngay_den_han, ngay_den_han,
         'Bảo dưỡng định kỳ theo chính sách'
  FROM ung_vien
  ON CONFLICT (chinh_sach_id, thiet_bi_id, ky_han)
    WHERE loai = 'PM'
      AND chinh_sach_id IS NOT NULL
      AND thiet_bi_id IS NOT NULL
      AND ky_han IS NOT NULL
  DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$function$;