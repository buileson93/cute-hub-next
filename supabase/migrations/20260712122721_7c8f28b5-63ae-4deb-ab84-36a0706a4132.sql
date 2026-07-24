
-- ============================================================
-- T12: PM Policy → Work Order (Phiếu công việc bảo dưỡng) → KPI
-- ============================================================

-- 1) Cột theo dõi bảo dưỡng trên thiết bị
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS ngay_bao_tri_gan_nhat date,
  ADD COLUMN IF NOT EXISTS ngay_bao_tri_ke_tiep date;

-- 2) Bảng phiếu công việc bảo dưỡng (work order)
CREATE SEQUENCE IF NOT EXISTS public.cong_viec_bao_tri_seq;

CREATE TABLE IF NOT EXISTS public.cong_viec_bao_tri (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_cong_viec text UNIQUE,
  thiet_bi_id uuid REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  chinh_sach_id uuid REFERENCES public.bao_tri_chinh_sach(id) ON DELETE SET NULL,
  loai text NOT NULL DEFAULT 'PM',            -- PM = định kỳ, CM = khắc phục
  uu_tien text NOT NULL DEFAULT 'TRUNG_BINH', -- THAP | TRUNG_BINH | CAO | KHAN
  trang_thai text NOT NULL DEFAULT 'MO',      -- MO | DANG_LAM | HOAN_THANH | HUY
  ngay_den_han date,
  ngay_bat_dau date,
  ngay_hoan_thanh date,
  nguoi_phu_trach uuid,
  bao_tri_id uuid REFERENCES public.bao_tri(id) ON DELETE SET NULL,
  mo_ta text,
  ghi_chu text,
  don_vi_id_snapshot uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cvbt_thiet_bi ON public.cong_viec_bao_tri(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_cvbt_trang_thai ON public.cong_viec_bao_tri(trang_thai);
CREATE INDEX IF NOT EXISTS idx_cvbt_den_han ON public.cong_viec_bao_tri(ngay_den_han);
CREATE INDEX IF NOT EXISTS idx_cvbt_don_vi_snap ON public.cong_viec_bao_tri(don_vi_id_snapshot);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cong_viec_bao_tri TO authenticated;
GRANT ALL ON public.cong_viec_bao_tri TO service_role;

ALTER TABLE public.cong_viec_bao_tri ENABLE ROW LEVEL SECURITY;

CREATE POLICY cvbt_select ON public.cong_viec_bao_tri
  FOR SELECT USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );

CREATE POLICY cvbt_write ON public.cong_viec_bao_tri
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 3) Trigger: mã công việc tự sinh + updated_at + snapshot đơn vị
CREATE OR REPLACE FUNCTION public.trg_cvbt_ma()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ma_cong_viec IS NULL OR NEW.ma_cong_viec = '' THEN
    NEW.ma_cong_viec := 'WO-' || lpad(nextval('public.cong_viec_bao_tri_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER cvbt_ma_before_ins
  BEFORE INSERT ON public.cong_viec_bao_tri
  FOR EACH ROW EXECUTE FUNCTION public.trg_cvbt_ma();

CREATE TRIGGER cvbt_snapshot
  BEFORE INSERT OR UPDATE ON public.cong_viec_bao_tri
  FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();

CREATE TRIGGER cvbt_updated_at
  BEFORE UPDATE ON public.cong_viec_bao_tri
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) RPC: sinh phiếu công việc định kỳ từ chính sách bảo dưỡng
CREATE OR REPLACE FUNCTION public.tao_cong_viec_bao_tri_dinh_ky()
RETURNS TABLE(so_phieu_tao integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền tạo phiếu công việc bảo dưỡng';
  END IF;

  WITH ung_vien AS (
    SELECT t.id AS thiet_bi_id,
           t.he_thong_id,
           cs.id AS chinh_sach_id,
           COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE) AS ngay_den_han
    FROM public.thiet_bi t
    JOIN public.bao_tri_chinh_sach cs
      ON cs.loai_thiet_bi_id = t.loai_thiet_bi_id
     AND cs.active = true
    WHERE t.thoi_diem_cham_dut IS NULL
      AND COALESCE(t.ngay_bao_tri_ke_tiep, CURRENT_DATE)
          <= CURRENT_DATE + COALESCE(cs.canh_bao_truoc_ngay, 0)
      AND NOT EXISTS (
        SELECT 1 FROM public.cong_viec_bao_tri cv
        WHERE cv.thiet_bi_id = t.id
          AND cv.chinh_sach_id = cs.id
          AND cv.trang_thai IN ('MO','DANG_LAM')
      )
  )
  INSERT INTO public.cong_viec_bao_tri
    (thiet_bi_id, he_thong_id, chinh_sach_id, loai, trang_thai, ngay_den_han, mo_ta)
  SELECT thiet_bi_id, he_thong_id, chinh_sach_id, 'PM', 'MO', ngay_den_han,
         'Bảo dưỡng định kỳ theo chính sách'
  FROM ung_vien;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.tao_cong_viec_bao_tri_dinh_ky() TO authenticated;

-- 5) RPC: hoàn thành phiếu công việc → cập nhật chu kỳ thiết bị
CREATE OR REPLACE FUNCTION public.hoan_thanh_cong_viec_bao_tri(_id uuid, _bao_tri_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tb uuid;
  v_cs uuid;
  v_chu_ky integer;
BEGIN
  IF NOT public.can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền cập nhật phiếu công việc bảo dưỡng';
  END IF;

  UPDATE public.cong_viec_bao_tri
     SET trang_thai = 'HOAN_THANH',
         ngay_hoan_thanh = CURRENT_DATE,
         bao_tri_id = COALESCE(_bao_tri_id, bao_tri_id)
   WHERE id = _id
   RETURNING thiet_bi_id, chinh_sach_id INTO v_tb, v_cs;

  IF v_tb IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy phiếu công việc';
  END IF;

  SELECT chu_ky_ngay INTO v_chu_ky FROM public.bao_tri_chinh_sach WHERE id = v_cs;

  UPDATE public.thiet_bi
     SET ngay_bao_tri_gan_nhat = CURRENT_DATE,
         ngay_bao_tri_ke_tiep = CASE
           WHEN v_chu_ky IS NOT NULL AND v_chu_ky > 0
           THEN CURRENT_DATE + v_chu_ky
           ELSE ngay_bao_tri_ke_tiep END
   WHERE id = v_tb;
END;
$$;

GRANT EXECUTE ON FUNCTION public.hoan_thanh_cong_viec_bao_tri(uuid, uuid) TO authenticated;

-- 6) View KPI bảo dưỡng theo đơn vị
CREATE OR REPLACE VIEW public.v_kpi_bao_tri
WITH (security_invoker = true) AS
SELECT
  cv.don_vi_id_snapshot AS don_vi_id,
  dv.ten AS don_vi_ten,
  count(*) AS tong_cong_viec,
  count(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH') AS da_hoan_thanh,
  count(*) FILTER (WHERE cv.trang_thai IN ('MO','DANG_LAM')) AS dang_mo,
  count(*) FILTER (WHERE cv.trang_thai IN ('MO','DANG_LAM') AND cv.ngay_den_han < CURRENT_DATE) AS qua_han,
  count(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH' AND cv.ngay_hoan_thanh <= cv.ngay_den_han) AS hoan_thanh_dung_han,
  ROUND(
    100.0 * count(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH' AND cv.ngay_hoan_thanh <= cv.ngay_den_han)
    / NULLIF(count(*) FILTER (WHERE cv.trang_thai = 'HOAN_THANH'), 0)
  , 1) AS ty_le_dung_han
FROM public.cong_viec_bao_tri cv
LEFT JOIN public.dm_don_vi dv ON dv.id = cv.don_vi_id_snapshot
GROUP BY cv.don_vi_id_snapshot, dv.ten;

GRANT SELECT ON public.v_kpi_bao_tri TO authenticated;
