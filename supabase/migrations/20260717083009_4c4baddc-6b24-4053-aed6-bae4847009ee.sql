
CREATE OR REPLACE FUNCTION public.thao_tai_san_khoi_thanh_phan(
  p_gan_id uuid,
  p_new_vi_tri_id uuid,
  p_ly_do text DEFAULT 'tháo',
  p_ghi_chu text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thiet_bi_id uuid;
  v_thanh_phan_id uuid;
BEGIN
  IF p_new_vi_tri_id IS NULL THEN
    RAISE EXCEPTION 'Phải chọn vị trí mới cho tài sản trước khi tháo';
  END IF;

  SELECT thiet_bi_id, thanh_phan_id INTO v_thiet_bi_id, v_thanh_phan_id
    FROM public.gan_chuc_nang
   WHERE id = p_gan_id AND den_ngay IS NULL;

  IF v_thiet_bi_id IS NULL THEN
    RAISE EXCEPTION 'Bản ghi gắn không tồn tại hoặc đã tháo';
  END IF;

  PERFORM public._validate_vi_tri_tuong_thich(p_new_vi_tri_id, v_thanh_phan_id);

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
