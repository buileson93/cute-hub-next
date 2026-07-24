-- 1) Bổ sung trường ngữ cảnh lắp đặt cho THÀNH PHẦN HỆ THỐNG (vị trí chức năng)
ALTER TABLE public.he_thong_thanh_phan
  ADD COLUMN IF NOT EXISTS vi_tri_id uuid REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trang_thai_id uuid REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;

-- 2) Cập nhật hàm đồng bộ: thiết bị KẾ THỪA vị trí / trạng thái / đơn vị / hệ thống
--    từ thành phần hệ thống đang lắp. Khi tháo ra thì để trống (Chưa lắp đặt),
--    riêng thiết bị đã Ngừng khai thác / Thanh lý thì giữ nguyên trạng thái vòng đời.
CREATE OR REPLACE FUNCTION public.sync_thiet_bi_he_thong_cache(p_thiet_bi_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ht uuid; v_vt uuid; v_tt uuid; v_dv uuid;
  v_nhom uuid; v_pl uuid;
  v_found boolean := false;
  v_retired boolean := false;
BEGIN
  IF p_thiet_bi_id IS NULL THEN RETURN; END IF;

  SELECT tp.he_thong_id, tp.vi_tri_id, tp.trang_thai_id, tp.don_vi_id_snapshot
    INTO v_ht, v_vt, v_tt, v_dv
  FROM public.gan_chuc_nang g
  JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
  WHERE g.thiet_bi_id = p_thiet_bi_id AND g.den_ngay IS NULL
  LIMIT 1;
  v_found := FOUND;

  SELECT COALESCE(dts.ma IN ('NGUNG_KHAI_THAC','THANH_LY'), false)
    INTO v_retired
  FROM public.thiet_bi t
  LEFT JOIN public.dm_trang_thai_thiet_bi dts ON dts.id = t.trang_thai_id
  WHERE t.id = p_thiet_bi_id;
  v_retired := COALESCE(v_retired, false);

  IF v_found THEN
    IF v_ht IS NOT NULL THEN
      SELECT nhom_he_thong_id, phan_loai_id INTO v_nhom, v_pl
      FROM public.dm_he_thong WHERE id = v_ht;
    END IF;
    UPDATE public.thiet_bi SET
      he_thong_id       = v_ht,
      nhom_he_thong_id  = COALESCE(v_nhom, nhom_he_thong_id),
      phan_loai_id      = COALESCE(v_pl, phan_loai_id),
      vi_tri_id         = v_vt,
      don_vi_quan_ly_id = COALESCE(v_dv, don_vi_quan_ly_id),
      trang_thai_id     = CASE WHEN v_retired THEN trang_thai_id ELSE COALESCE(v_tt, trang_thai_id) END
    WHERE id = p_thiet_bi_id;
  ELSE
    UPDATE public.thiet_bi SET
      he_thong_id       = NULL,
      nhom_he_thong_id  = NULL,
      phan_loai_id      = NULL,
      vi_tri_id         = NULL,
      trang_thai_id     = CASE WHEN v_retired THEN trang_thai_id ELSE NULL END
    WHERE id = p_thiet_bi_id;
  END IF;
END;
$function$;

-- 3) Khi sửa ngữ cảnh trên chính THÀNH PHẦN HỆ THỐNG thì đồng bộ xuống thiết bị đang lắp
CREATE OR REPLACE FUNCTION public.trg_http_sync_device()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_tb uuid;
BEGIN
  SELECT g.thiet_bi_id INTO v_tb
  FROM public.gan_chuc_nang g
  WHERE g.thanh_phan_id = NEW.id AND g.den_ngay IS NULL
  LIMIT 1;
  IF v_tb IS NOT NULL THEN
    PERFORM public.sync_thiet_bi_he_thong_cache(v_tb);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS http_sync_device ON public.he_thong_thanh_phan;
CREATE TRIGGER http_sync_device
AFTER UPDATE OF vi_tri_id, trang_thai_id, don_vi_id_snapshot, he_thong_id
ON public.he_thong_thanh_phan
FOR EACH ROW EXECUTE FUNCTION public.trg_http_sync_device();

-- 4) Di trú dữ liệu hiện có: nạp ngữ cảnh lắp đặt từ thiết bị đang lắp lên thành phần hệ thống
UPDATE public.he_thong_thanh_phan tp SET
  vi_tri_id          = COALESCE(tp.vi_tri_id, t.vi_tri_id),
  trang_thai_id      = COALESCE(tp.trang_thai_id, t.trang_thai_id),
  don_vi_id_snapshot = COALESCE(tp.don_vi_id_snapshot, t.don_vi_quan_ly_id, t.don_vi_id)
FROM public.gan_chuc_nang g
JOIN public.thiet_bi t ON t.id = g.thiet_bi_id
WHERE g.thanh_phan_id = tp.id AND g.den_ngay IS NULL;