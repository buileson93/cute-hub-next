
CREATE OR REPLACE FUNCTION public.hoan_thanh_hong_hoc(_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_ok boolean;
  v_hh public.hong_hoc%ROWTYPE;
  v_pa text;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập' USING ERRCODE = '28000';
  END IF;

  SELECT (public.has_role(auth.uid(),'admin')
       OR public.has_role(auth.uid(),'phong_kt')
       OR public.has_role(auth.uid(),'ktv'))
    INTO v_role_ok;
  IF NOT v_role_ok THEN
    RAISE EXCEPTION 'Không có quyền hoàn thành hỏng hóc' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_hh FROM public.hong_hoc WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu hỏng hóc %', _id USING ERRCODE = 'P0002';
  END IF;

  -- Chuẩn hoá phương án về snake_case ổn định.
  v_pa := lower(regexp_replace(coalesce(v_hh.phuong_an,''), '\s+', '_', 'g'));
  v_pa := replace(replace(replace(replace(v_pa,'ế','e'),'ữ','u'),'ý','y'),'ả','a');
  v_pa := CASE
            WHEN v_pa LIKE 'thay%' THEN 'thay_the'
            WHEN v_pa LIKE 'sua%'  THEN 'sua_chua'
            WHEN v_pa LIKE 'thanh%' THEN 'thanh_ly'
            ELSE v_pa
          END;

  IF v_pa = '' THEN
    RAISE EXCEPTION 'Phiếu chưa có phương án — không thể hoàn thành' USING ERRCODE = '22023';
  END IF;

  IF v_pa = 'thay_the' AND v_hh.thiet_bi_thay_the_id IS NULL THEN
    RAISE EXCEPTION 'Phương án thay thế yêu cầu thiết bị thay thế' USING ERRCODE = '22023';
  END IF;

  -- Cập nhật phiếu (nguyên tử).
  UPDATE public.hong_hoc
     SET trang_thai = 'Hoàn thành',
         ngay_hoan_thanh = coalesce(ngay_hoan_thanh, v_now::date::text),
         updated_at = v_now
   WHERE id = _id;

  -- Nếu thay thế: đóng gan_chuc_nang hiện hành của thiết bị hỏng + mở dòng mới cho thiết bị thay thế
  IF v_pa = 'thay_the' AND v_hh.thanh_phan_id IS NOT NULL AND v_hh.thiet_bi_hong_id IS NOT NULL THEN
    UPDATE public.gan_chuc_nang
       SET den_ngay = v_now
     WHERE thanh_phan_id = v_hh.thanh_phan_id
       AND thiet_bi_id   = v_hh.thiet_bi_hong_id
       AND den_ngay IS NULL;

    INSERT INTO public.gan_chuc_nang
      (thanh_phan_id, thiet_bi_id, tu_ngay, ly_do, hong_hoc_id, created_by)
    VALUES
      (v_hh.thanh_phan_id, v_hh.thiet_bi_thay_the_id, v_now,
       'Thay thế theo phiếu hỏng hóc ' || coalesce(v_hh.ma_hong_hoc, _id::text),
       _id, auth.uid());
  END IF;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.hoan_thanh_hong_hoc(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hoan_thanh_hong_hoc(uuid) TO authenticated;
