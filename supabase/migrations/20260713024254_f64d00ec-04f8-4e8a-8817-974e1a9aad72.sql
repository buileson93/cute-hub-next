-- ============================================================================
-- SỰ CỐ (su_co): validation + nguồn thời gian duy nhất + backfill FK khớp mã.
-- ============================================================================

-- 1) NGUỒN THỜI GIAN DUY NHẤT: downtime (phút) từ ngày phát hiện → khắc phục.
CREATE OR REPLACE FUNCTION public.su_co_downtime_minutes(
  p_ngay_phat_hien date,
  p_thoi_diem_khac_phuc timestamptz
) RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_ngay_phat_hien IS NULL OR p_thoi_diem_khac_phuc IS NULL THEN NULL
    ELSE GREATEST(
      0,
      (EXTRACT(EPOCH FROM (p_thoi_diem_khac_phuc - p_ngay_phat_hien::timestamptz)) / 60)::int
    )
  END
$$;

-- 2) Trigger kiểm tra hợp lệ: khôi phục không trước phát hiện, downtime không âm,
--    và tự điền downtime từ nguồn duy nhất khi còn trống.
CREATE OR REPLACE FUNCTION public.validate_su_co()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.thoi_diem_khac_phuc IS NOT NULL AND NEW.ngay_phat_hien IS NOT NULL
     AND NEW.thoi_diem_khac_phuc < NEW.ngay_phat_hien::timestamptz THEN
    RAISE EXCEPTION 'Thời điểm khắc phục (%) không thể trước ngày phát hiện (%)',
      NEW.thoi_diem_khac_phuc, NEW.ngay_phat_hien
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.thoi_gian_gian_doan IS NOT NULL AND NEW.thoi_gian_gian_doan < 0 THEN
    RAISE EXCEPTION 'Thời gian gián đoạn không thể âm (%)', NEW.thoi_gian_gian_doan
      USING ERRCODE = 'check_violation';
  END IF;

  -- Nguồn duy nhất: khi có đủ mốc mà chưa nhập downtime → tự tính.
  IF NEW.thoi_gian_gian_doan IS NULL
     AND NEW.thoi_diem_khac_phuc IS NOT NULL
     AND NEW.ngay_phat_hien IS NOT NULL THEN
    NEW.thoi_gian_gian_doan := public.su_co_downtime_minutes(NEW.ngay_phat_hien, NEW.thoi_diem_khac_phuc);
  END IF;

  RETURN NEW;
END;
$$;

-- Chạy SAU trigger resolve (điền FK) nhờ thứ tự tên (validate > resolve).
DROP TRIGGER IF EXISTS trg_su_co_validate ON public.su_co;
CREATE TRIGGER trg_su_co_validate
  BEFORE INSERT OR UPDATE ON public.su_co
  FOR EACH ROW EXECUTE FUNCTION public.validate_su_co();

-- 3) BACKFILL FK bằng KHỚP MÃ CHÍNH XÁC (không đoán) cho dữ liệu hiện có.
UPDATE public.su_co s
SET thiet_bi_id = t.id
FROM public.thiet_bi t
WHERE s.thiet_bi_id IS NULL
  AND NULLIF(s.thiet_bi, '') IS NOT NULL
  AND t.ma_thiet_bi = s.thiet_bi;

UPDATE public.su_co s
SET he_thong_id = t.he_thong_id
FROM public.thiet_bi t
WHERE s.he_thong_id IS NULL
  AND s.thiet_bi_id = t.id
  AND t.he_thong_id IS NOT NULL;

UPDATE public.su_co s
SET he_thong_id = s.he_thong::uuid
FROM public.dm_he_thong h
WHERE s.he_thong_id IS NULL
  AND s.he_thong ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  AND h.id = s.he_thong::uuid;

-- 4) Báo cáo các bản ghi KHÔNG map được (admin xem để xử lý thủ công, không đoán).
CREATE OR REPLACE FUNCTION public.su_co_unmapped_fk()
RETURNS TABLE (id uuid, ma_su_co text, thiet_bi text, he_thong text, ly_do text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Chỉ admin được xem danh sách chưa liên kết';
  END IF;
  RETURN QUERY
  SELECT s.id, s.ma_su_co, s.thiet_bi, s.he_thong,
    CASE
      WHEN NULLIF(s.thiet_bi, '') IS NOT NULL AND s.thiet_bi_id IS NULL
        THEN 'Thiết bị không khớp mã chính xác'
      WHEN NULLIF(s.he_thong, '') IS NOT NULL AND s.he_thong_id IS NULL
        THEN 'Hệ thống không khớp'
      ELSE 'Khác'
    END
  FROM public.su_co s
  WHERE (NULLIF(s.thiet_bi, '') IS NOT NULL AND s.thiet_bi_id IS NULL)
     OR (NULLIF(s.he_thong, '') IS NOT NULL AND s.he_thong_id IS NULL);
END;
$$;

REVOKE ALL ON FUNCTION public.su_co_unmapped_fk() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.su_co_unmapped_fk() TO authenticated;