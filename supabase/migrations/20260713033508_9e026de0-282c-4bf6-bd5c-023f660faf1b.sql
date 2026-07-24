-- ============================================================
-- Idempotent scheduler: sinh phiếu bảo dưỡng định kỳ KHÔNG trùng
-- theo (chính sách, thiết bị, kỳ hạn). Chống cả race-condition.
-- ============================================================

-- 1) Cột "kỳ hạn" (period key) cho phiếu công việc bảo dưỡng.
--    Với phiếu PM, kỳ hạn = ngày đến hạn của chu kỳ.
ALTER TABLE public.cong_viec_bao_tri
  ADD COLUMN IF NOT EXISTS ky_han date;

-- 2) Backfill kỳ hạn cho phiếu PM hiện có.
UPDATE public.cong_viec_bao_tri
   SET ky_han = ngay_den_han
 WHERE loai = 'PM'
   AND chinh_sach_id IS NOT NULL
   AND thiet_bi_id IS NOT NULL
   AND ngay_den_han IS NOT NULL
   AND ky_han IS NULL;

-- 3) Nếu đã tồn tại phiếu trùng (chính sách, thiết bị, kỳ hạn),
--    giữ lại 1 phiếu tốt nhất (ưu tiên phiếu đang mở, cũ nhất),
--    các phiếu còn lại bỏ kỳ hạn để không vi phạm unique key.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY chinh_sach_id, thiet_bi_id, ky_han
           ORDER BY (trang_thai IN ('MO','DANG_LAM')) DESC, created_at ASC
         ) AS rn
  FROM public.cong_viec_bao_tri
  WHERE loai = 'PM'
    AND chinh_sach_id IS NOT NULL
    AND thiet_bi_id IS NOT NULL
    AND ky_han IS NOT NULL
)
UPDATE public.cong_viec_bao_tri c
   SET ky_han = NULL
  FROM ranked r
 WHERE c.id = r.id AND r.rn > 1;

-- 4) Unique key đảm bảo mỗi (chính sách, thiết bị, kỳ hạn) chỉ 1 phiếu PM.
--    Partial index -> không ảnh hưởng phiếu CM/thủ công (ky_han NULL).
CREATE UNIQUE INDEX IF NOT EXISTS uq_cvbt_pm_ky
  ON public.cong_viec_bao_tri (chinh_sach_id, thiet_bi_id, ky_han)
  WHERE loai = 'PM'
    AND chinh_sach_id IS NOT NULL
    AND thiet_bi_id IS NOT NULL
    AND ky_han IS NOT NULL;

-- 5) RPC sinh phiếu định kỳ — GIỮ NGUYÊN signature.
--    Ghi ky_han + ON CONFLICT DO NOTHING => idempotent & an toàn khi chạy song song.
CREATE OR REPLACE FUNCTION public.tao_cong_viec_bao_tri_dinh_ky()
RETURNS TABLE(so_phieu_tao integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
           COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE) AS ngay_den_han
    FROM public.thiet_bi t
    JOIN public.bao_tri_chinh_sach cs
      ON cs.loai_thiet_bi_id = t.loai_thiet_bi_id
     AND cs.active = true
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
    (thiet_bi_id, he_thong_id, chinh_sach_id, loai, trang_thai, ngay_den_han, ky_han, mo_ta)
  SELECT thiet_bi_id, he_thong_id, chinh_sach_id, 'PM', 'MO', ngay_den_han, ngay_den_han,
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
$$;

GRANT EXECUTE ON FUNCTION public.tao_cong_viec_bao_tri_dinh_ky() TO authenticated;