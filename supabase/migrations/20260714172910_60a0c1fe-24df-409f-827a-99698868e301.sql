-- Task 11: Toàn vẹn khi xoá danh mục — chặn ở CSDL + RPC xoá an toàn.
-- Đổi ON DELETE SET NULL -> RESTRICT cho các FK danh mục trên thiet_bi.
-- (dm_model đã RESTRICT sẵn; giữ nguyên.)

ALTER TABLE public.thiet_bi DROP CONSTRAINT IF EXISTS thiet_bi_nha_san_xuat_id_fkey;
ALTER TABLE public.thiet_bi
  ADD CONSTRAINT thiet_bi_nha_san_xuat_id_fkey
  FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE RESTRICT;

ALTER TABLE public.thiet_bi DROP CONSTRAINT IF EXISTS thiet_bi_nha_cung_cap_id_fkey;
ALTER TABLE public.thiet_bi
  ADD CONSTRAINT thiet_bi_nha_cung_cap_id_fkey
  FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE RESTRICT;

ALTER TABLE public.thiet_bi DROP CONSTRAINT IF EXISTS thiet_bi_loai_thiet_bi_id_fkey;
ALTER TABLE public.thiet_bi
  ADD CONSTRAINT thiet_bi_loai_thiet_bi_id_fkey
  FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE RESTRICT;

-- RPC xoá an toàn: đếm tham chiếu trên thiet_bi, chặn nếu > 0.
CREATE OR REPLACE FUNCTION public.dm_xoa_an_toan(_bang text, _id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_col text;
  v_count integer;
BEGIN
  -- Chỉ Admin / phòng KT được xoá danh mục.
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Forbidden: cần quyền admin hoặc phong_kt' USING ERRCODE = '42501';
  END IF;

  v_col := CASE _bang
    WHEN 'dm_nha_san_xuat'  THEN 'nha_san_xuat_id'
    WHEN 'dm_nha_cung_cap'  THEN 'nha_cung_cap_id'
    WHEN 'dm_loai_thiet_bi' THEN 'loai_thiet_bi_id'
    WHEN 'dm_model'         THEN 'model_id'
    ELSE NULL
  END;

  IF v_col IS NULL THEN
    RAISE EXCEPTION 'Bảng danh mục không hỗ trợ xoá qua RPC: %', _bang USING ERRCODE = '22023';
  END IF;

  EXECUTE format('SELECT count(*) FROM public.thiet_bi WHERE %I = $1', v_col)
    INTO v_count USING _id;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Không thể xoá: còn % thiết bị đang tham chiếu.', v_count
      USING ERRCODE = '23503';
  END IF;

  EXECUTE format('DELETE FROM public.%I WHERE id = $1', _bang) USING _id;

  RETURN jsonb_build_object('deleted', 1, 'bang', _bang, 'id', _id);
END;
$$;

REVOKE ALL ON FUNCTION public.dm_xoa_an_toan(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dm_xoa_an_toan(text, uuid) TO authenticated;
