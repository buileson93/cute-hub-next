-- 1) Cột cấp phát trên thiet_bi
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS nguoi_giu text,
  ADD COLUMN IF NOT EXISTS don_vi_giu_id uuid REFERENCES public.dm_don_vi(id),
  ADD COLUMN IF NOT EXISTS ngay_cap_phat timestamptz,
  ADD COLUMN IF NOT EXISTS trang_thai_cap_phat text NOT NULL DEFAULT 'san_sang';

-- 2) Bảng lịch sử cấp phát / thu hồi
CREATE TABLE IF NOT EXISTS public.thiet_bi_cap_phat (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  hanh_dong text NOT NULL CHECK (hanh_dong IN ('cap_phat','thu_hoi')),
  nguoi_giu text,
  don_vi_giu_id uuid REFERENCES public.dm_don_vi(id),
  ghi_chu text,
  thoi_diem timestamptz NOT NULL DEFAULT now(),
  thuc_hien_boi uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_thiet_bi_cap_phat_tb ON public.thiet_bi_cap_phat(thiet_bi_id, thoi_diem DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_cap_phat TO authenticated;
GRANT ALL ON public.thiet_bi_cap_phat TO service_role;

ALTER TABLE public.thiet_bi_cap_phat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Đã đăng nhập xem lịch sử cấp phát"
  ON public.thiet_bi_cap_phat FOR SELECT TO authenticated USING (true);

CREATE POLICY "Đã đăng nhập ghi lịch sử cấp phát"
  ON public.thiet_bi_cap_phat FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Quản trị sửa lịch sử cấp phát"
  ON public.thiet_bi_cap_phat FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Quản trị xoá lịch sử cấp phát"
  ON public.thiet_bi_cap_phat FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) RPC T2.1: cấp phát / thu hồi trong một bước
CREATE OR REPLACE FUNCTION public.cap_phat_thiet_bi(
  _thiet_bi_id uuid,
  _hanh_dong text,
  _nguoi_giu text DEFAULT NULL,
  _don_vi_giu_id uuid DEFAULT NULL,
  _ghi_chu text DEFAULT NULL
)
RETURNS public.thiet_bi
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _row public.thiet_bi;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF _hanh_dong NOT IN ('cap_phat','thu_hoi') THEN
    RAISE EXCEPTION 'Hành động không hợp lệ: %', _hanh_dong;
  END IF;

  IF _hanh_dong = 'cap_phat' THEN
    IF coalesce(btrim(_nguoi_giu), '') = '' AND _don_vi_giu_id IS NULL THEN
      RAISE EXCEPTION 'Cần chọn người giữ hoặc đơn vị khi cấp phát';
    END IF;
    UPDATE public.thiet_bi SET
      nguoi_giu = _nguoi_giu,
      don_vi_giu_id = _don_vi_giu_id,
      ngay_cap_phat = now(),
      trang_thai_cap_phat = 'da_cap_phat',
      updated_at = now()
    WHERE id = _thiet_bi_id
    RETURNING * INTO _row;
  ELSE
    UPDATE public.thiet_bi SET
      nguoi_giu = NULL,
      don_vi_giu_id = NULL,
      ngay_cap_phat = NULL,
      trang_thai_cap_phat = 'san_sang',
      updated_at = now()
    WHERE id = _thiet_bi_id
    RETURNING * INTO _row;
  END IF;

  IF _row.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy thiết bị %', _thiet_bi_id;
  END IF;

  INSERT INTO public.thiet_bi_cap_phat (thiet_bi_id, hanh_dong, nguoi_giu, don_vi_giu_id, ghi_chu, thuc_hien_boi)
  VALUES (_thiet_bi_id, _hanh_dong, _nguoi_giu, _don_vi_giu_id, _ghi_chu, _uid);

  RETURN _row;
END;
$$;

REVOKE ALL ON FUNCTION public.cap_phat_thiet_bi(uuid, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cap_phat_thiet_bi(uuid, text, text, uuid, text) TO authenticated, service_role;