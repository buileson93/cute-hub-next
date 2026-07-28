CREATE OR REPLACE FUNCTION public.validate_thiet_bi_he_thong_khi_lap() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_tb_he_thong_id uuid;
  v_tp_he_thong_id uuid;
BEGIN
  -- Bỏ qua khi bản ghi đã tháo
  IF NEW.den_ngay IS NOT NULL THEN
    RETURN NEW;
  END IF;

  SELECT he_thong_id INTO v_tb_he_thong_id
  FROM public.thiet_bi WHERE id = NEW.thiet_bi_id;

  -- Nếu tài sản chưa có hệ thống mặc định → tự gán theo hệ thống của thành phần đích
  IF v_tb_he_thong_id IS NULL THEN
    SELECT he_thong_id INTO v_tp_he_thong_id
    FROM public.he_thong_thanh_phan WHERE id = NEW.thanh_phan_id;

    IF v_tp_he_thong_id IS NOT NULL THEN
      UPDATE public.thiet_bi
      SET he_thong_id = v_tp_he_thong_id
      WHERE id = NEW.thiet_bi_id AND he_thong_id IS NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;