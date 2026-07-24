
-- 1) Trigger: khi lắp tài sản vào thành phần, tài sản phải có he_thong_id
CREATE OR REPLACE FUNCTION public.validate_thiet_bi_he_thong_khi_lap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_he_thong_id uuid;
  v_ma text;
BEGIN
  -- Chỉ kiểm tra khi bản ghi lắp còn hiệu lực (chưa tháo)
  IF NEW.den_ngay IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT he_thong_id, ma_thiet_bi INTO v_he_thong_id, v_ma
  FROM public.thiet_bi
  WHERE id = NEW.thiet_bi_id;

  IF v_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Tài sản % chưa gán hệ thống — không thể lắp vào thành phần. Vui lòng cập nhật hệ thống cho tài sản trước.', COALESCE(v_ma, NEW.thiet_bi_id::text)
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_thiet_bi_he_thong_khi_lap ON public.gan_chuc_nang;
CREATE TRIGGER trg_validate_thiet_bi_he_thong_khi_lap
BEFORE INSERT OR UPDATE ON public.gan_chuc_nang
FOR EACH ROW EXECUTE FUNCTION public.validate_thiet_bi_he_thong_khi_lap();

-- 2) Trigger: dm_he_thong phải có nhom_he_thong_id + phan_loai_id
CREATE OR REPLACE FUNCTION public.validate_dm_he_thong_taxonomy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.nhom_he_thong_id IS NULL THEN
    RAISE EXCEPTION 'Hệ thống % phải có Nhóm hệ thống', COALESCE(NEW.ma, NEW.ten)
      USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.phan_loai_id IS NULL THEN
    RAISE EXCEPTION 'Hệ thống % phải có Phân loại', COALESCE(NEW.ma, NEW.ten)
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_dm_he_thong_taxonomy ON public.dm_he_thong;
CREATE TRIGGER trg_validate_dm_he_thong_taxonomy
BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong
FOR EACH ROW EXECUTE FUNCTION public.validate_dm_he_thong_taxonomy();

-- 3) View báo cáo summary — nguồn số liệu dùng chung
CREATE OR REPLACE VIEW public.v_he_thong_ky_thuat_summary AS
SELECT
  (SELECT COUNT(*) FROM public.dm_nhom_he_thong WHERE COALESCE(active, true))    AS so_nhom,
  (SELECT COUNT(*) FROM public.dm_he_thong      WHERE COALESCE(active, true))    AS so_he_thong,
  (SELECT COUNT(*) FROM public.he_thong_thanh_phan)                              AS so_thanh_phan,
  (SELECT COUNT(*) FROM public.thiet_bi)                                         AS so_tai_san,
  (SELECT COUNT(*) FROM public.thiet_bi WHERE he_thong_id IS NULL)               AS so_tai_san_chua_gan_he_thong,
  (SELECT COUNT(DISTINCT thiet_bi_id) FROM public.gan_chuc_nang WHERE den_ngay IS NULL) AS so_tai_san_dang_lap;

GRANT SELECT ON public.v_he_thong_ky_thuat_summary TO authenticated;
GRANT SELECT ON public.v_he_thong_ky_thuat_summary TO anon;
