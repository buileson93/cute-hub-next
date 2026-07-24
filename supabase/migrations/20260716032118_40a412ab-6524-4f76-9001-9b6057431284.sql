
ALTER TABLE public.hong_hoc ADD COLUMN IF NOT EXISTS he_thong_id uuid;

CREATE OR REPLACE VIEW public.v_ly_lich_he_thong
WITH (security_invoker = true) AS
  SELECT s.he_thong_id, s.ngay_phat_hien AS thoi_diem, 'su_co'::text AS loai_su_kien,
         COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de, NULLIF(s.muc_do, ''::text) AS mo_ta,
         'su_co'::text AS nguon, s.id AS nguon_id, s.thanh_phan_id, s.thiet_bi_id
  FROM public.su_co s WHERE s.he_thong_id IS NOT NULL
UNION ALL
  SELECT b.he_thong_id, (b.ngay_bat_dau)::timestamptz, 'bao_tri'::text,
         COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text),
         NULLIF(b.ket_qua, ''::text), 'bao_tri'::text, b.id, b.thanh_phan_id, b.thiet_bi_id
  FROM public.bao_tri b WHERE b.he_thong_id IS NOT NULL
UNION ALL
  SELECT h.he_thong_id, (h.ngay_hong)::timestamptz, 'hong_hoc'::text,
         COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text),
         NULLIF(h.phuong_an, ''::text), 'hong_hoc'::text, h.id, h.thanh_phan_id, h.thiet_bi_hong_id
  FROM public.hong_hoc h WHERE h.he_thong_id IS NOT NULL;

GRANT SELECT ON public.v_ly_lich_he_thong TO authenticated;
