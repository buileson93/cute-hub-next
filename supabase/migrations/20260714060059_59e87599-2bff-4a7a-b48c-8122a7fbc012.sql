-- ============================================================================
-- Prompt 6: Tổ chức đa tầng (dm_to_chuc) + gắn hệ thống vào tổ chức + view toàn cảnh
-- ============================================================================

-- 1) Bảng cây tổ chức ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dm_to_chuc (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  loai text NOT NULL CHECK (loai IN ('tong_cong_ty','don_vi_thanh_vien','co_quan_ngoai')),
  to_chuc_cha_id uuid REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL,
  mau_sac text,
  ghi_chu text,
  thu_tu integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_to_chuc TO authenticated;
GRANT ALL ON public.dm_to_chuc TO service_role;

ALTER TABLE public.dm_to_chuc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "to_chuc_read_active" ON public.dm_to_chuc
  FOR SELECT TO authenticated USING (is_active_user(auth.uid()));

CREATE POLICY "to_chuc_write_manager" ON public.dm_to_chuc
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_dm_to_chuc_updated_at
  BEFORE UPDATE ON public.dm_to_chuc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Seed cây tổ chức (idempotent theo mã) ---------------------------------
INSERT INTO public.dm_to_chuc (ma, ten, loai, mau_sac, thu_tu) VALUES
  ('VATM', 'Tổng công ty Quản lý bay Việt Nam', 'tong_cong_ty', '#2563eb', 0)
ON CONFLICT (ma) DO NOTHING;

INSERT INTO public.dm_to_chuc (ma, ten, loai, to_chuc_cha_id, mau_sac, thu_tu)
SELECT v.ma, v.ten, 'don_vi_thanh_vien', (SELECT id FROM public.dm_to_chuc WHERE ma='VATM'), v.mau_sac, v.thu_tu
FROM (VALUES
  ('QLBMT', 'Công ty Quản lý bay miền Trung', '#059669', 1),
  ('QLBMN', 'Công ty Quản lý bay miền Nam', '#d97706', 2),
  ('QLBMB', 'Công ty Quản lý bay miền Bắc', '#dc2626', 3),
  ('CTQLLKL', 'Công ty Quản lý luồng không lưu', '#7c3aed', 4),
  ('TTTBTTHK', 'Trung tâm Thông báo tin tức hàng không', '#0891b2', 5)
) AS v(ma, ten, mau_sac, thu_tu)
ON CONFLICT (ma) DO NOTHING;

INSERT INTO public.dm_to_chuc (ma, ten, loai, mau_sac, thu_tu)
SELECT v.ma, v.ten, 'co_quan_ngoai', v.mau_sac, v.thu_tu
FROM (VALUES
  ('ACV', 'Tổng công ty Cảng hàng không Việt Nam (ACV)', '#64748b', 10),
  ('TCKTTV', 'Tổng cục Khí tượng Thủy văn', '#94a3b8', 11)
) AS v(ma, ten, mau_sac, thu_tu)
ON CONFLICT (ma) DO NOTHING;

-- 3) Gắn hệ thống vào tổ chức ---------------------------------------------
ALTER TABLE public.dm_he_thong
  ADD COLUMN IF NOT EXISTS to_chuc_id uuid REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;

-- Hệ thống nội bộ -> QLB miền Trung (đơn vị vận hành của dự án)
UPDATE public.dm_he_thong
SET to_chuc_id = (SELECT id FROM public.dm_to_chuc WHERE ma='QLBMT')
WHERE to_chuc_id IS NULL
  AND (pham_vi_quan_ly IS DISTINCT FROM 'ben_ngoai');

-- Hệ thống bên ngoài -> cơ quan ngoài tương ứng (map nhãn to_chuc_so_huu)
UPDATE public.dm_he_thong
SET to_chuc_id = (SELECT id FROM public.dm_to_chuc WHERE ma='ACV')
WHERE pham_vi_quan_ly = 'ben_ngoai'
  AND to_chuc_id IS NULL
  AND upper(coalesce(to_chuc_so_huu,'')) LIKE '%ACV%';

-- 4) View toàn cảnh: node hệ thống + tổ chức + bậc liên kết ----------------
CREATE OR REPLACE VIEW public.v_do_thi_toan_canh
WITH (security_invoker = on) AS
SELECT
  h.id,
  h.ma,
  h.ten,
  h.pham_vi_quan_ly,
  (h.pham_vi_quan_ly = 'ben_ngoai') AS ben_ngoai,
  h.nhom_he_thong_id,
  nh.ten AS nhom_ten,
  h.don_vi_id,
  dv.ten AS don_vi_ten,
  h.to_chuc_id,
  tc.ma AS to_chuc_ma,
  tc.ten AS to_chuc_ten,
  tc.loai AS to_chuc_loai,
  tc.mau_sac AS to_chuc_mau,
  tc.to_chuc_cha_id,
  h.to_chuc_so_huu,
  coalesce(deg.bac, 0) AS bac_lien_ket
FROM public.dm_he_thong h
LEFT JOIN public.dm_nhom_he_thong nh ON nh.id = h.nhom_he_thong_id
LEFT JOIN public.dm_don_vi dv ON dv.id = h.don_vi_id
LEFT JOIN public.dm_to_chuc tc ON tc.id = h.to_chuc_id
LEFT JOIN LATERAL (
  SELECT count(*) AS bac
  FROM public.lien_ket_he_thong lk
  WHERE lk.hieu_luc_den IS NULL
    AND (lk.he_thong_nguon_id = h.id OR lk.he_thong_dich_id = h.id)
) deg ON true
WHERE h.active = true;

GRANT SELECT ON public.v_do_thi_toan_canh TO authenticated;
