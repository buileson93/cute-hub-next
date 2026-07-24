-- 1) Thêm cột hạn kiểm kê kế tiếp vào thiet_bi
ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS ngay_kiem_ke_ke_tiep date;

-- 2) Bảng kiem_ke
CREATE TABLE public.kiem_ke (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  nguoi_kiem text,
  thoi_diem timestamptz NOT NULL DEFAULT now(),
  tinh_trang text NOT NULL,
  vi_tri_gps text,
  anh_url text,
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_kiem_ke_thiet_bi ON public.kiem_ke (thiet_bi_id, thoi_diem DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kiem_ke TO authenticated;
GRANT ALL ON public.kiem_ke TO service_role;

ALTER TABLE public.kiem_ke ENABLE ROW LEVEL SECURITY;

-- RLS theo đơn vị: xem/ghi kiểm kê cho thiết bị thuộc đơn vị mình, hoặc người quản lý thiết bị.
CREATE POLICY kiem_ke_select ON public.kiem_ke
  FOR SELECT TO authenticated
  USING (
    public.is_active_user(auth.uid())
    AND (public.can_manage_equipment(auth.uid()) OR public.can_view_thiet_bi(thiet_bi_id, auth.uid()))
  );

CREATE POLICY kiem_ke_write ON public.kiem_ke
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()) OR public.can_view_thiet_bi(thiet_bi_id, auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()) OR public.can_view_thiet_bi(thiet_bi_id, auth.uid()));

-- 3) RPC ghi_kiem_ke: tạo dòng kiểm kê + cập nhật hạn kế tiếp theo chu kỳ cấu hình
CREATE OR REPLACE FUNCTION public.ghi_kiem_ke(
  _thiet_bi_id uuid,
  _tinh_trang text,
  _nguoi_kiem text DEFAULT NULL,
  _vi_tri_gps text DEFAULT NULL,
  _anh_url text DEFAULT NULL,
  _ghi_chu text DEFAULT NULL,
  _thoi_diem timestamptz DEFAULT now(),
  _chu_ky_ngay integer DEFAULT 365
)
RETURNS public.kiem_ke
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _row public.kiem_ke;
  _cyc integer := _chu_ky_ngay;
  _td timestamptz := COALESCE(_thoi_diem, now());
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Chưa đăng nhập';
  END IF;
  IF coalesce(btrim(_tinh_trang), '') = '' THEN
    RAISE EXCEPTION 'Cần nhập tình trạng kiểm kê';
  END IF;
  IF NOT (public.can_manage_equipment(_uid) OR public.can_view_thiet_bi(_thiet_bi_id, _uid)) THEN
    RAISE EXCEPTION 'Không có quyền kiểm kê thiết bị này';
  END IF;
  IF _cyc IS NULL OR _cyc <= 0 THEN
    _cyc := 365;
  END IF;

  INSERT INTO public.kiem_ke (thiet_bi_id, nguoi_kiem, thoi_diem, tinh_trang, vi_tri_gps, anh_url, ghi_chu, created_by)
  VALUES (_thiet_bi_id, _nguoi_kiem, _td, _tinh_trang, _vi_tri_gps, _anh_url, _ghi_chu, _uid)
  RETURNING * INTO _row;

  UPDATE public.thiet_bi
  SET ngay_kiem_ke_ke_tiep = ((_td AT TIME ZONE 'UTC')::date + _cyc),
      updated_at = now()
  WHERE id = _thiet_bi_id;

  RETURN _row;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.ghi_kiem_ke(uuid, text, text, text, text, text, timestamptz, integer) TO authenticated;