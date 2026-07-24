-- ============================================================================
-- LIÊN KẾT MỨC KHE/CỔNG (supporting-link, RFC 8345) — pilot.
-- Nối khe/cổng của 2 thành phần hệ thống; gộp roll-up lên mức hệ thống;
-- xem đấu nối theo thời điểm. Cùng quy ước hiệu lực = hieu_luc_den IS NULL (1B).
-- ============================================================================

CREATE TABLE public.lien_ket_khe (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khe_nguon_id       uuid NOT NULL REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE,
  khe_dich_id        uuid NOT NULL REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE,
  loai_lien_ket_id   uuid NOT NULL REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT,
  giao_dien_nguon    text,
  giao_dien_dich     text,
  giao_thuc          text,
  mo_ta              text,
  trang_thai         text NOT NULL DEFAULT 'hoat_dong'
                       CHECK (trang_thai IN ('hoat_dong','tam_ngung')),
  hieu_luc_tu        timestamptz NOT NULL DEFAULT now(),
  hieu_luc_den       timestamptz,
  don_vi_id_snapshot uuid,
  ghi_chu            text,
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkk_khong_tu_noi CHECK (khe_nguon_id <> khe_dich_id),
  CONSTRAINT lkk_hieu_luc_hop_le CHECK (hieu_luc_den IS NULL OR hieu_luc_den >= hieu_luc_tu)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lien_ket_khe TO authenticated;
GRANT ALL ON public.lien_ket_khe TO service_role;

-- Index phục vụ roll-up + truy vấn theo khe (không trùng với index mức hệ thống ở 1B).
CREATE INDEX idx_lkk_nguon ON public.lien_ket_khe (khe_nguon_id);
CREATE INDEX idx_lkk_dich  ON public.lien_ket_khe (khe_dich_id);
CREATE INDEX idx_lkk_loai  ON public.lien_ket_khe (loai_lien_ket_id);
CREATE INDEX ix_lkk_hieuluc ON public.lien_ket_khe (hieu_luc_tu, hieu_luc_den);
-- Chống trùng cạnh khe đang hiệu lực (quy ước hieu_luc_den IS NULL như 1B).
CREATE UNIQUE INDEX ux_lkk_canh_hieu_luc
  ON public.lien_ket_khe (khe_nguon_id, khe_dich_id, loai_lien_ket_id)
  WHERE hieu_luc_den IS NULL;

ALTER TABLE public.lien_ket_khe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lkk_select" ON public.lien_ket_khe
  FOR SELECT TO authenticated
  USING (
    is_active_user(auth.uid())
    AND (
      can_manage_equipment(auth.uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );

CREATE POLICY "lkk_write_manager" ON public.lien_ket_khe
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- Snapshot đơn vị + người tạo từ hệ thống của khe nguồn.
CREATE OR REPLACE FUNCTION public.lkk_snapshot_don_vi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT h.don_vi_id INTO NEW.don_vi_id_snapshot
    FROM public.he_thong_thanh_phan tp
    JOIN public.dm_he_thong h ON h.id = tp.he_thong_id
    WHERE tp.id = NEW.khe_nguon_id;
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lkk_snapshot_don_vi
  BEFORE INSERT ON public.lien_ket_khe
  FOR EACH ROW EXECUTE FUNCTION public.lkk_snapshot_don_vi();

CREATE TRIGGER trg_lien_ket_khe_updated_at
  BEFORE UPDATE ON public.lien_ket_khe
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER audit_trg_lien_ket_khe
  AFTER INSERT OR DELETE OR UPDATE ON public.lien_ket_khe
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- ---- ROLL-UP: khe -> cạnh mức hệ thống ------------------------------------
-- 2 khe thuộc 2 hệ thống khác nhau -> 1 cạnh hệ thống. security_invoker: RLS áp dụng.
CREATE VIEW public.v_lien_ket_tu_khe
WITH (security_invoker = on) AS
SELECT
  lkk.id                 AS lien_ket_khe_id,
  sn.he_thong_id         AS he_thong_nguon_id,
  sd.he_thong_id         AS he_thong_dich_id,
  lkk.khe_nguon_id,
  lkk.khe_dich_id,
  lkk.loai_lien_ket_id,
  llk.ma                 AS loai_ma,
  llk.co_huong,
  llk.lan_truyen_tac_dong,
  lkk.giao_dien_nguon,
  lkk.giao_dien_dich,
  lkk.giao_thuc,
  lkk.trang_thai
FROM public.lien_ket_khe lkk
JOIN public.he_thong_thanh_phan sn ON sn.id = lkk.khe_nguon_id
JOIN public.he_thong_thanh_phan sd ON sd.id = lkk.khe_dich_id
JOIN public.dm_loai_lien_ket llk   ON llk.id = lkk.loai_lien_ket_id
WHERE lkk.hieu_luc_den IS NULL
  AND sn.he_thong_id <> sd.he_thong_id;

GRANT SELECT ON public.v_lien_ket_tu_khe TO authenticated;

-- ---- SƠ ĐỒ ĐẤU NỐI THEO THỜI ĐIỂM -----------------------------------------
-- Trả các liên kết khe còn hiệu lực tại 1 mốc thời gian (mặc định now()).
-- SECURITY INVOKER (mặc định) -> RLS của lien_ket_khe được áp dụng.
CREATE OR REPLACE FUNCTION public.v_lien_ket_hieu_luc(tai_thoi_diem timestamptz DEFAULT now())
RETURNS SETOF public.lien_ket_khe
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT *
  FROM public.lien_ket_khe
  WHERE hieu_luc_tu <= tai_thoi_diem
    AND (hieu_luc_den IS NULL OR hieu_luc_den > tai_thoi_diem);
$$;

GRANT EXECUTE ON FUNCTION public.v_lien_ket_hieu_luc(timestamptz) TO authenticated, service_role;