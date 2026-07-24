
-- 1) Trigger: khi INSERT/UPDATE gan_chuc_nang mà active (den_ngay IS NULL),
--    đồng bộ vi_tri_id + don_vi_id của tài sản theo thành phần cha.
CREATE OR REPLACE FUNCTION public.trg_sync_thiet_bi_from_thanh_phan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vi_tri uuid;
  v_don_vi uuid;
BEGIN
  IF NEW.den_ngay IS NULL THEN
    SELECT tp.vi_tri_id,
           COALESCE(tp.don_vi_id_snapshot, ht.don_vi_id)
      INTO v_vi_tri, v_don_vi
      FROM public.he_thong_thanh_phan tp
      JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
     WHERE tp.id = NEW.thanh_phan_id;

    UPDATE public.thiet_bi
       SET vi_tri_id = COALESCE(v_vi_tri, vi_tri_id),
           don_vi_id = COALESCE(v_don_vi, don_vi_id)
     WHERE id = NEW.thiet_bi_id;

    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gcn_sync_thiet_bi ON public.gan_chuc_nang;
CREATE TRIGGER gcn_sync_thiet_bi
BEFORE INSERT OR UPDATE ON public.gan_chuc_nang
FOR EACH ROW EXECUTE FUNCTION public.trg_sync_thiet_bi_from_thanh_phan();

-- 2) Trigger: khi thành phần đổi vi_tri_id -> cascade sang tài sản đang lắp
CREATE OR REPLACE FUNCTION public.trg_cascade_thanh_phan_vi_tri()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.vi_tri_id IS DISTINCT FROM OLD.vi_tri_id THEN
    UPDATE public.thiet_bi tb
       SET vi_tri_id = NEW.vi_tri_id
      FROM public.gan_chuc_nang gcn
     WHERE gcn.thanh_phan_id = NEW.id
       AND gcn.den_ngay IS NULL
       AND tb.id = gcn.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS thanh_phan_cascade_vi_tri ON public.he_thong_thanh_phan;
CREATE TRIGGER thanh_phan_cascade_vi_tri
AFTER UPDATE OF vi_tri_id ON public.he_thong_thanh_phan
FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_thanh_phan_vi_tri();

-- 3) Mở rộng cascade đơn vị: khi hệ thống đổi don_vi_id -> cập nhật tài sản đang lắp
CREATE OR REPLACE FUNCTION public.trg_cascade_he_thong_don_vi_to_tai_san()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.don_vi_id IS DISTINCT FROM OLD.don_vi_id THEN
    UPDATE public.thiet_bi tb
       SET don_vi_id = NEW.don_vi_id
      FROM public.gan_chuc_nang gcn
      JOIN public.he_thong_thanh_phan tp ON tp.id = gcn.thanh_phan_id
     WHERE tp.he_thong_id = NEW.id
       AND gcn.den_ngay IS NULL
       AND tb.id = gcn.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS he_thong_cascade_don_vi_tai_san ON public.dm_he_thong;
CREATE TRIGGER he_thong_cascade_don_vi_tai_san
AFTER UPDATE OF don_vi_id ON public.dm_he_thong
FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_he_thong_don_vi_to_tai_san();

-- 4) RPC: lắp tài sản vào thành phần
CREATE OR REPLACE FUNCTION public.lap_tai_san_vao_thanh_phan(
  p_thiet_bi_id uuid,
  p_thanh_phan_id uuid,
  p_ly_do text DEFAULT 'lắp mới',
  p_ghi_chu text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Đóng bản ghi active hiện tại (nếu có) cho tài sản này
  UPDATE public.gan_chuc_nang
     SET den_ngay = now()
   WHERE thiet_bi_id = p_thiet_bi_id AND den_ngay IS NULL;

  INSERT INTO public.gan_chuc_nang (thanh_phan_id, thiet_bi_id, ly_do, ghi_chu, nguoi_thuc_hien)
  VALUES (p_thanh_phan_id, p_thiet_bi_id, p_ly_do, p_ghi_chu, current_uid())
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5) RPC: tháo tài sản — BẮT BUỘC có vị trí mới
CREATE OR REPLACE FUNCTION public.thao_tai_san_khoi_thanh_phan(
  p_gan_id uuid,
  p_new_vi_tri_id uuid,
  p_ly_do text DEFAULT 'tháo',
  p_ghi_chu text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thiet_bi_id uuid;
BEGIN
  IF p_new_vi_tri_id IS NULL THEN
    RAISE EXCEPTION 'Phải chọn vị trí mới cho tài sản trước khi tháo';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.dm_vi_tri WHERE id = p_new_vi_tri_id) THEN
    RAISE EXCEPTION 'Vị trí mới không tồn tại';
  END IF;

  SELECT thiet_bi_id INTO v_thiet_bi_id
    FROM public.gan_chuc_nang
   WHERE id = p_gan_id AND den_ngay IS NULL;

  IF v_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Bản ghi gắn không tồn tại hoặc đã tháo';
  END IF;

  UPDATE public.gan_chuc_nang
     SET den_ngay = now(),
         ly_do = p_ly_do,
         ghi_chu = COALESCE(p_ghi_chu, ghi_chu)
   WHERE id = p_gan_id;

  UPDATE public.thiet_bi
     SET vi_tri_id = p_new_vi_tri_id
   WHERE id = v_thiet_bi_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.lap_tai_san_vao_thanh_phan(uuid, uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.thao_tai_san_khoi_thanh_phan(uuid, uuid, text, text) TO authenticated;

-- 6) Backfill: đồng bộ hiện trạng tài sản đang lắp theo thành phần cha
UPDATE public.thiet_bi tb
   SET vi_tri_id = tp.vi_tri_id,
       don_vi_id = COALESCE(tp.don_vi_id_snapshot, ht.don_vi_id, tb.don_vi_id)
  FROM public.gan_chuc_nang gcn
  JOIN public.he_thong_thanh_phan tp ON tp.id = gcn.thanh_phan_id
  JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
 WHERE gcn.den_ngay IS NULL
   AND tb.id = gcn.thiet_bi_id
   AND (tb.vi_tri_id IS DISTINCT FROM tp.vi_tri_id
        OR tb.don_vi_id IS DISTINCT FROM COALESCE(tp.don_vi_id_snapshot, ht.don_vi_id));
