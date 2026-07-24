-- ============================================================================
-- Liên kết giữa các hệ thống (first-class system links) — PILOT VHF–VCCS
-- ============================================================================

-- 1) DANH MỤC LOẠI LIÊN KẾT --------------------------------------------------
CREATE TABLE public.dm_loai_lien_ket (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  mo_ta text,
  mau_sac text NOT NULL DEFAULT '#6b7280',
  kieu_net text NOT NULL DEFAULT 'solid' CHECK (kieu_net IN ('solid','dashed','dotted')),
  thu_tu integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_loai_lien_ket TO authenticated;
GRANT ALL ON public.dm_loai_lien_ket TO service_role;

ALTER TABLE public.dm_loai_lien_ket ENABLE ROW LEVEL SECURITY;

CREATE POLICY "llk_lookup_read_active" ON public.dm_loai_lien_ket
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "llk_lookup_write_manager" ON public.dm_loai_lien_ket
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_dm_loai_lien_ket_updated_at
  BEFORE UPDATE ON public.dm_loai_lien_ket
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audit_trg_dm_loai_lien_ket
  AFTER INSERT OR UPDATE OR DELETE ON public.dm_loai_lien_ket
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

INSERT INTO public.dm_loai_lien_ket (ma, ten, mo_ta, mau_sac, kieu_net, thu_tu) VALUES
  ('DAU_NOI_VAT_LY',    'Đấu nối vật lý',   'Kết nối cáp/đường truyền vật lý giữa hai hệ thống', '#6b7280', 'solid',  1),
  ('LUONG_TIN_HIEU',    'Luồng tín hiệu',   'Luồng dữ liệu/tín hiệu logic giữa hai hệ thống',    '#2563eb', 'solid',  2),
  ('PHU_THUOC_DICH_VU', 'Phụ thuộc dịch vụ','Hệ thống nguồn phụ thuộc dịch vụ của hệ thống đích', '#d97706', 'dashed', 3),
  ('DU_PHONG',          'Dự phòng',         'Liên kết đóng vai trò dự phòng',                     '#16a34a', 'dotted', 4);

-- 2) BẢNG LIÊN KẾT HỆ THỐNG ---------------------------------------------------
CREATE TABLE public.lien_ket_he_thong (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  he_thong_nguon_id uuid NOT NULL REFERENCES public.dm_he_thong(id) ON DELETE CASCADE,
  he_thong_dich_id uuid NOT NULL REFERENCES public.dm_he_thong(id) ON DELETE CASCADE,
  loai_lien_ket_id uuid NOT NULL REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT,
  lop text NOT NULL DEFAULT 'logic' CHECK (lop IN ('vat_ly','logic')),
  huong text NOT NULL DEFAULT 'mot_chieu' CHECK (huong IN ('mot_chieu','hai_chieu')),
  giao_dien_nguon text,
  giao_dien_dich text,
  giao_thuc text,
  mo_ta_tin_hieu text,
  vai_tro_du_phong text CHECK (vai_tro_du_phong IN ('chinh','du_phong')),
  trang_thai text NOT NULL DEFAULT 'hoat_dong' CHECK (trang_thai IN ('hoat_dong','ngung')),
  hieu_luc_tu date,
  hieu_luc_den date,
  don_vi_id_snapshot uuid,
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lkht_khong_tu_noi CHECK (he_thong_nguon_id <> he_thong_dich_id)
);

-- Chống trùng cạnh đang hiệu lực trên (nguồn, đích, loại, lớp)
CREATE UNIQUE INDEX ux_lkht_canh_hieu_luc
  ON public.lien_ket_he_thong (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
  WHERE trang_thai = 'hoat_dong';

CREATE INDEX idx_lkht_nguon ON public.lien_ket_he_thong (he_thong_nguon_id);
CREATE INDEX idx_lkht_dich ON public.lien_ket_he_thong (he_thong_dich_id);
CREATE INDEX idx_lkht_don_vi ON public.lien_ket_he_thong (don_vi_id_snapshot);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lien_ket_he_thong TO authenticated;
GRANT ALL ON public.lien_ket_he_thong TO service_role;

ALTER TABLE public.lien_ket_he_thong ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lkht_select" ON public.lien_ket_he_thong
  FOR SELECT TO authenticated
  USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );

CREATE POLICY "lkht_write_manager" ON public.lien_ket_he_thong
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- Snapshot đơn vị từ hệ thống nguồn khi chưa cung cấp
CREATE OR REPLACE FUNCTION public.lkht_snapshot_don_vi()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT don_vi_id INTO NEW.don_vi_id_snapshot
    FROM public.dm_he_thong WHERE id = NEW.he_thong_nguon_id;
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lkht_snapshot_don_vi
  BEFORE INSERT ON public.lien_ket_he_thong
  FOR EACH ROW EXECUTE FUNCTION public.lkht_snapshot_don_vi();

CREATE TRIGGER trg_lien_ket_he_thong_updated_at
  BEFORE UPDATE ON public.lien_ket_he_thong
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER audit_trg_lien_ket_he_thong
  AFTER INSERT OR UPDATE OR DELETE ON public.lien_ket_he_thong
  FOR EACH ROW EXECUTE FUNCTION audit_row_change();

-- 3) VIEW ĐỒ THỊ (đọc thẳng vào canvas) --------------------------------------
CREATE VIEW public.v_do_thi_he_thong
WITH (security_invoker = on) AS
SELECT
  lk.id,
  lk.he_thong_nguon_id AS nguon_id,
  hn.ten               AS nguon_ten,
  nhn.ten              AS nguon_nhom,
  dvn.ten              AS nguon_don_vi,
  lk.he_thong_dich_id  AS dich_id,
  hd.ten               AS dich_ten,
  nhd.ten              AS dich_nhom,
  dvd.ten              AS dich_don_vi,
  lk.loai_lien_ket_id,
  llk.ma               AS loai_ma,
  llk.ten              AS loai_ten,
  llk.mau_sac,
  llk.kieu_net,
  lk.lop,
  lk.huong,
  lk.vai_tro_du_phong,
  lk.trang_thai,
  lk.don_vi_id_snapshot
FROM public.lien_ket_he_thong lk
JOIN public.dm_he_thong hn ON hn.id = lk.he_thong_nguon_id
JOIN public.dm_he_thong hd ON hd.id = lk.he_thong_dich_id
JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
LEFT JOIN public.dm_nhom_he_thong nhn ON nhn.id = hn.nhom_he_thong_id
LEFT JOIN public.dm_nhom_he_thong nhd ON nhd.id = hd.nhom_he_thong_id
LEFT JOIN public.dm_don_vi dvn ON dvn.id = hn.don_vi_id
LEFT JOIN public.dm_don_vi dvd ON dvd.id = hd.don_vi_id;

GRANT SELECT ON public.v_do_thi_he_thong TO authenticated;

-- 4) RPC PHÂN TÍCH TÁC ĐỘNG ---------------------------------------------------
-- Nếu p_he_thong_id ngừng hoạt động, trả về các hệ thống bị ảnh hưởng.
-- Lan truyền theo cạnh LUONG_TIN_HIEU (nguồn -> đích) và PHU_THUOC_DICH_VU
-- (đích -> nguồn: hệ thống nguồn phụ thuộc dịch vụ của đích). Cạnh hai chiều
-- lan truyền cả hai phía.
CREATE OR REPLACE FUNCTION public.phan_tich_tac_dong(p_he_thong_id uuid)
RETURNS TABLE (
  he_thong_id uuid,
  ma text,
  ten text,
  do_sau integer,
  duong_dan uuid[]
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH RECURSIVE canh AS (
    -- Chuẩn hoá cạnh lan truyền: tac_dong_tu -> tac_dong_den
    SELECT lk.he_thong_nguon_id AS tu, lk.he_thong_dich_id AS den
    FROM public.lien_ket_he_thong lk
    JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
    WHERE lk.trang_thai = 'hoat_dong' AND llk.ma = 'LUONG_TIN_HIEU'
    UNION ALL
    SELECT lk.he_thong_dich_id, lk.he_thong_nguon_id
    FROM public.lien_ket_he_thong lk
    JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
    WHERE lk.trang_thai = 'hoat_dong' AND llk.ma = 'PHU_THUOC_DICH_VU'
    UNION ALL
    -- Cạnh hai chiều: lan truyền ngược lại cho LUONG_TIN_HIEU
    SELECT lk.he_thong_dich_id, lk.he_thong_nguon_id
    FROM public.lien_ket_he_thong lk
    JOIN public.dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
    WHERE lk.trang_thai = 'hoat_dong' AND llk.ma = 'LUONG_TIN_HIEU' AND lk.huong = 'hai_chieu'
  ),
  duyet AS (
    SELECT c.den AS he_thong_id, 1 AS do_sau, ARRAY[p_he_thong_id, c.den] AS duong_dan
    FROM canh c
    WHERE c.tu = p_he_thong_id
    UNION ALL
    SELECT c.den, d.do_sau + 1, d.duong_dan || c.den
    FROM canh c
    JOIN duyet d ON c.tu = d.he_thong_id
    WHERE c.den <> ALL(d.duong_dan) AND d.do_sau < 20
  )
  SELECT DISTINCT ON (d.he_thong_id)
    d.he_thong_id, ht.ma, ht.ten, d.do_sau, d.duong_dan
  FROM duyet d
  JOIN public.dm_he_thong ht ON ht.id = d.he_thong_id
  WHERE d.he_thong_id <> p_he_thong_id
  ORDER BY d.he_thong_id, d.do_sau ASC;
$$;

GRANT EXECUTE ON FUNCTION public.phan_tich_tac_dong(uuid) TO authenticated;

-- 5) SEED PILOT VHF–VCCS ------------------------------------------------------
DO $$
DECLARE
  v_vhf uuid;
  v_vccs uuid;
  v_loai_tin_hieu uuid;
  v_loai_vat_ly uuid;
BEGIN
  SELECT id INTO v_loai_tin_hieu FROM public.dm_loai_lien_ket WHERE ma = 'LUONG_TIN_HIEU';
  SELECT id INTO v_loai_vat_ly FROM public.dm_loai_lien_ket WHERE ma = 'DAU_NOI_VAT_LY';

  -- Hệ thống VHF
  SELECT id INTO v_vhf FROM public.dm_he_thong
  WHERE ma = 'VHF' OR upper(ten) LIKE 'VHF%' ORDER BY (ma = 'VHF') DESC LIMIT 1;
  IF v_vhf IS NULL THEN
    INSERT INTO public.dm_he_thong (ma, ten, mo_ta)
    VALUES ('VHF', 'Hệ thống VHF', 'Hệ thống liên lạc thoại VHF (pilot)')
    RETURNING id INTO v_vhf;
  END IF;

  -- Hệ thống VCCS
  SELECT id INTO v_vccs FROM public.dm_he_thong
  WHERE ma = 'VCCS' OR upper(ten) LIKE 'VCCS%' ORDER BY (ma = 'VCCS') DESC LIMIT 1;
  IF v_vccs IS NULL THEN
    INSERT INTO public.dm_he_thong (ma, ten, mo_ta)
    VALUES ('VCCS', 'Hệ thống VCCS', 'Voice Communication Control System (pilot)')
    RETURNING id INTO v_vccs;
  END IF;

  -- Liên kết luồng tín hiệu (logic, hai chiều)
  IF NOT EXISTS (
    SELECT 1 FROM public.lien_ket_he_thong
    WHERE he_thong_nguon_id = v_vhf AND he_thong_dich_id = v_vccs
      AND loai_lien_ket_id = v_loai_tin_hieu AND lop = 'logic' AND trang_thai = 'hoat_dong'
  ) THEN
    INSERT INTO public.lien_ket_he_thong
      (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop, huong, giao_thuc, mo_ta_tin_hieu)
    VALUES
      (v_vhf, v_vccs, v_loai_tin_hieu, 'logic', 'hai_chieu', 'VoIP/E1', 'Kết nối thoại VHF vào VCCS');
  END IF;

  -- Liên kết đấu nối vật lý (vật lý, một chiều)
  IF NOT EXISTS (
    SELECT 1 FROM public.lien_ket_he_thong
    WHERE he_thong_nguon_id = v_vhf AND he_thong_dich_id = v_vccs
      AND loai_lien_ket_id = v_loai_vat_ly AND lop = 'vat_ly' AND trang_thai = 'hoat_dong'
  ) THEN
    INSERT INTO public.lien_ket_he_thong
      (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop, huong, giao_dien_nguon, giao_dien_dich)
    VALUES
      (v_vhf, v_vccs, v_loai_vat_ly, 'vat_ly', 'mot_chieu', 'E1/IP', 'E1/IP');
  END IF;
END $$;