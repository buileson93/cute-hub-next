-- =====================================================================
-- Đồng nhất "Sổ lý lịch" 3 lớp: Hệ thống ↔ Thành phần ↔ Thiết bị cụ thể
-- =====================================================================

-- 1) Thêm liên kết Thành phần (vị trí chức năng) cho sự cố / bảo dưỡng / hỏng hóc
ALTER TABLE public.su_co
  ADD COLUMN IF NOT EXISTS thanh_phan_id uuid REFERENCES public.he_thong_thanh_phan(id) ON DELETE SET NULL;

ALTER TABLE public.bao_tri
  ADD COLUMN IF NOT EXISTS thanh_phan_id uuid REFERENCES public.he_thong_thanh_phan(id) ON DELETE SET NULL;

ALTER TABLE public.hong_hoc
  ADD COLUMN IF NOT EXISTS thanh_phan_id uuid REFERENCES public.he_thong_thanh_phan(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_su_co_thanh_phan ON public.su_co(thanh_phan_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_thanh_phan ON public.bao_tri(thanh_phan_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_thanh_phan ON public.hong_hoc(thanh_phan_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_he_thong ON public.hong_hoc(he_thong_id);

-- 2) Hàm helper: suy ra 3 lớp theo thời điểm sự kiện
--    - Có thành phần  -> suy he_thong_id + chụp thiết bị cụ thể đang lắp
--    - Có thiết bị    -> suy thành phần đang lắp -> suy he_thong_id
CREATE OR REPLACE FUNCTION public._sync_3lop(
  p_thanh_phan_id uuid,
  p_he_thong_id uuid,
  p_thiet_bi_id uuid,
  p_ngay date,
  OUT o_thanh_phan_id uuid,
  OUT o_he_thong_id uuid,
  OUT o_thiet_bi_id uuid
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_evt date := COALESCE(p_ngay, CURRENT_DATE);
BEGIN
  o_thanh_phan_id := p_thanh_phan_id;
  o_he_thong_id   := p_he_thong_id;
  o_thiet_bi_id   := p_thiet_bi_id;

  IF o_thanh_phan_id IS NOT NULL THEN
    IF o_he_thong_id IS NULL THEN
      SELECT tp.he_thong_id INTO o_he_thong_id
      FROM public.he_thong_thanh_phan tp WHERE tp.id = o_thanh_phan_id;
    END IF;
    IF o_thiet_bi_id IS NULL THEN
      SELECT g.thiet_bi_id INTO o_thiet_bi_id
      FROM public.gan_chuc_nang g
      WHERE g.thanh_phan_id = o_thanh_phan_id
        AND g.tu_ngay <= v_evt
        AND (g.den_ngay IS NULL OR g.den_ngay >= v_evt)
      ORDER BY g.tu_ngay DESC LIMIT 1;
    END IF;
  ELSIF o_thiet_bi_id IS NOT NULL THEN
    SELECT g.thanh_phan_id INTO o_thanh_phan_id
    FROM public.gan_chuc_nang g
    WHERE g.thiet_bi_id = o_thiet_bi_id
      AND g.tu_ngay <= v_evt
      AND (g.den_ngay IS NULL OR g.den_ngay >= v_evt)
    ORDER BY g.tu_ngay DESC LIMIT 1;
    IF o_thanh_phan_id IS NOT NULL AND o_he_thong_id IS NULL THEN
      SELECT tp.he_thong_id INTO o_he_thong_id
      FROM public.he_thong_thanh_phan tp WHERE tp.id = o_thanh_phan_id;
    END IF;
  END IF;
END;
$$;

-- 3) Trigger cho từng bảng (cột ngày khác nhau)
CREATE OR REPLACE FUNCTION public.trg_su_co_3lop()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_id, NEW.ngay_phat_hien::date);
  NEW.thanh_phan_id := r.o_thanh_phan_id;
  NEW.he_thong_id   := r.o_he_thong_id;
  NEW.thiet_bi_id   := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_bao_tri_3lop()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_id, NEW.ngay_bat_dau);
  NEW.thanh_phan_id := r.o_thanh_phan_id;
  NEW.he_thong_id   := r.o_he_thong_id;
  NEW.thiet_bi_id   := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.trg_hong_hoc_3lop()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r record;
BEGIN
  SELECT * INTO r FROM public._sync_3lop(
    NEW.thanh_phan_id, NEW.he_thong_id, NEW.thiet_bi_hong_id, NEW.ngay_hong);
  NEW.thanh_phan_id  := r.o_thanh_phan_id;
  NEW.he_thong_id    := r.o_he_thong_id;
  NEW.thiet_bi_hong_id := r.o_thiet_bi_id;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS su_co_3lop ON public.su_co;
CREATE TRIGGER su_co_3lop BEFORE INSERT OR UPDATE ON public.su_co
  FOR EACH ROW EXECUTE FUNCTION public.trg_su_co_3lop();

DROP TRIGGER IF EXISTS bao_tri_3lop ON public.bao_tri;
CREATE TRIGGER bao_tri_3lop BEFORE INSERT OR UPDATE ON public.bao_tri
  FOR EACH ROW EXECUTE FUNCTION public.trg_bao_tri_3lop();

DROP TRIGGER IF EXISTS hong_hoc_3lop ON public.hong_hoc;
CREATE TRIGGER hong_hoc_3lop BEFORE INSERT OR UPDATE ON public.hong_hoc
  FOR EACH ROW EXECUTE FUNCTION public.trg_hong_hoc_3lop();

-- 4) View sổ lý lịch THÀNH PHẦN (thành phần là chủ thể)
CREATE OR REPLACE VIEW public.v_ly_lich_thanh_phan
WITH (security_invoker = true) AS
  SELECT g.thanh_phan_id, g.tu_ngay AS thoi_diem, 'lap'::text AS loai_su_kien,
         ('Lắp thiết bị: '::text || COALESCE(t.ten_thiet_bi, t.ma_thiet_bi)) AS tieu_de,
         NULLIF(g.ghi_chu, ''::text) AS mo_ta, 'gan_chuc_nang'::text AS nguon,
         g.id AS nguon_id, g.thiet_bi_id, t.ma_thiet_bi
  FROM gan_chuc_nang g JOIN thiet_bi t ON t.id = g.thiet_bi_id
UNION ALL
  SELECT g.thanh_phan_id, g.den_ngay, 'thao'::text,
         ('Tháo thiết bị: '::text || COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) || ' ('::text || COALESCE(g.ly_do, ''::text) || ')'::text),
         NULLIF(g.ghi_chu, ''::text), 'gan_chuc_nang'::text, g.id, g.thiet_bi_id, t.ma_thiet_bi
  FROM gan_chuc_nang g JOIN thiet_bi t ON t.id = g.thiet_bi_id WHERE g.den_ngay IS NOT NULL
UNION ALL
  SELECT s.thanh_phan_id, s.ngay_phat_hien, 'su_co'::text,
         COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text), NULLIF(s.muc_do, ''::text),
         'su_co'::text, s.id, s.thiet_bi_id, s.snapshot_ma_thiet_bi
  FROM su_co s WHERE s.thanh_phan_id IS NOT NULL
UNION ALL
  SELECT b.thanh_phan_id, (b.ngay_bat_dau)::timestamptz, 'bao_tri'::text,
         COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text),
         NULLIF(b.ket_qua, ''::text), 'bao_tri'::text, b.id, b.thiet_bi_id, b.snapshot_ma_thiet_bi
  FROM bao_tri b WHERE b.thanh_phan_id IS NOT NULL
UNION ALL
  SELECT h.thanh_phan_id, (h.ngay_hong)::timestamptz, 'hong_hoc'::text,
         COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text),
         NULLIF(h.phuong_an, ''::text), 'hong_hoc'::text, h.id, h.thiet_bi_hong_id, h.snapshot_ma_thiet_bi
  FROM hong_hoc h WHERE h.thanh_phan_id IS NOT NULL;

-- 5) View sổ lý lịch HỆ THỐNG (gộp toàn bộ sự kiện theo he_thong_id)
CREATE OR REPLACE VIEW public.v_ly_lich_he_thong
WITH (security_invoker = true) AS
  SELECT s.he_thong_id, s.ngay_phat_hien AS thoi_diem, 'su_co'::text AS loai_su_kien,
         COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de, NULLIF(s.muc_do, ''::text) AS mo_ta,
         'su_co'::text AS nguon, s.id AS nguon_id, s.thanh_phan_id, s.thiet_bi_id
  FROM su_co s WHERE s.he_thong_id IS NOT NULL
UNION ALL
  SELECT b.he_thong_id, (b.ngay_bat_dau)::timestamptz, 'bao_tri'::text,
         COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text),
         NULLIF(b.ket_qua, ''::text), 'bao_tri'::text, b.id, b.thanh_phan_id, b.thiet_bi_id
  FROM bao_tri b WHERE b.he_thong_id IS NOT NULL
UNION ALL
  SELECT h.he_thong_id, (h.ngay_hong)::timestamptz, 'hong_hoc'::text,
         COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text),
         NULLIF(h.phuong_an, ''::text), 'hong_hoc'::text, h.id, h.thanh_phan_id, h.thiet_bi_hong_id
  FROM hong_hoc h WHERE h.he_thong_id IS NOT NULL;

GRANT SELECT ON public.v_ly_lich_thanh_phan TO authenticated;
GRANT SELECT ON public.v_ly_lich_he_thong TO authenticated;