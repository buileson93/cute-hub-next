-- ===== Lịch sử theo từng khe linh kiện =====
CREATE OR REPLACE VIEW public.v_ly_lich_khe_linh_kien
WITH (security_invoker = on) AS
SELECT
  g.khe_id,
  k.thiet_bi_id            AS thiet_bi_cha_id,
  k.ma_khe,
  k.ten                    AS ten_khe,
  g.id                     AS gan_id,
  g.linh_kien_id,
  t.ma_thiet_bi,
  COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten_linh_kien,
  t.ma_serial,
  g.tu_ngay,
  g.den_ngay,
  g.ly_do,
  g.hong_hoc_id,
  g.nguoi_thuc_hien,
  g.ghi_chu
FROM public.gan_linh_kien g
JOIN public.thiet_bi_khe_linh_kien k ON k.id = g.khe_id
JOIN public.thiet_bi t ON t.id = g.linh_kien_id
ORDER BY g.khe_id, g.tu_ngay;

GRANT SELECT ON public.v_ly_lich_khe_linh_kien TO authenticated, anon, service_role;

-- ===== Bổ sung sự kiện khe linh kiện vào lý lịch thiết bị =====
CREATE OR REPLACE VIEW public.v_ly_lich_thiet_bi
WITH (security_invoker = on) AS
 SELECT g.thiet_bi_id, g.tu_ngay AS thoi_diem, 'lap'::text AS loai_su_kien,
    'Lắp vào vị trí: '::text || tp.ten AS tieu_de, NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_chuc_nang'::text AS nguon, g.id AS nguon_id
   FROM gan_chuc_nang g JOIN he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
UNION ALL
 SELECT g.thiet_bi_id, g.den_ngay AS thoi_diem, 'roi_vi_tri'::text AS loai_su_kien,
    ((('Rời vị trí: '::text || tp.ten) || ' ('::text) || g.ly_do) || ')'::text AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta, 'gan_chuc_nang'::text AS nguon, g.id AS nguon_id
   FROM gan_chuc_nang g JOIN he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
  WHERE g.den_ngay IS NOT NULL
UNION ALL
 SELECT g.linh_kien_id AS thiet_bi_id, g.tu_ngay AS thoi_diem, 'lap_linh_kien'::text AS loai_su_kien,
    'Lắp vào khe linh kiện: '::text || k.ten AS tieu_de, NULLIF(g.ghi_chu, ''::text) AS mo_ta,
    'gan_linh_kien'::text AS nguon, g.id AS nguon_id
   FROM gan_linh_kien g JOIN thiet_bi_khe_linh_kien k ON k.id = g.khe_id
UNION ALL
 SELECT g.linh_kien_id AS thiet_bi_id, g.den_ngay AS thoi_diem, 'roi_khe_linh_kien'::text AS loai_su_kien,
    ((('Rời khe linh kiện: '::text || k.ten) || ' ('::text) || g.ly_do) || ')'::text AS tieu_de,
    NULLIF(g.ghi_chu, ''::text) AS mo_ta, 'gan_linh_kien'::text AS nguon, g.id AS nguon_id
   FROM gan_linh_kien g JOIN thiet_bi_khe_linh_kien k ON k.id = g.khe_id
  WHERE g.den_ngay IS NOT NULL
UNION ALL
 SELECT h.thiet_bi_hong_id AS thiet_bi_id, h.ngay_hong::timestamp with time zone AS thoi_diem,
    'hong_hoc'::text AS loai_su_kien,
    COALESCE(NULLIF(h.mo_ta_hong_hoc, ''::text), NULLIF(h.bo_phan_hong, ''::text), 'Hỏng hóc'::text) AS tieu_de,
    NULLIF(h.phuong_an, ''::text) AS mo_ta, 'hong_hoc'::text AS nguon, h.id AS nguon_id
   FROM hong_hoc h WHERE h.thiet_bi_hong_id IS NOT NULL
UNION ALL
 SELECT b.thiet_bi_id, b.ngay_bat_dau::timestamp with time zone AS thoi_diem, 'bao_tri'::text AS loai_su_kien,
    COALESCE(NULLIF(b.mo_ta_cong_viec, ''::text), NULLIF(b.loai_bao_tri, ''::text), 'Bảo dưỡng'::text) AS tieu_de,
    NULLIF(b.ket_qua, ''::text) AS mo_ta, 'bao_tri'::text AS nguon, b.id AS nguon_id
   FROM bao_tri b WHERE b.thiet_bi_id IS NOT NULL
UNION ALL
 SELECT s.thiet_bi_id, s.ngay_phat_hien::timestamp with time zone AS thoi_diem, 'su_co'::text AS loai_su_kien,
    COALESCE(NULLIF(s.hien_tuong, ''::text), 'Sự cố'::text) AS tieu_de,
    NULLIF(s.muc_do, ''::text) AS mo_ta, 'su_co'::text AS nguon, s.id AS nguon_id
   FROM su_co s WHERE s.thiet_bi_id IS NOT NULL
UNION ALL
 SELECT bg.thiet_bi_id, bg.ngay_nhan::timestamp with time zone AS thoi_diem, 'ban_giao'::text AS loai_su_kien,
    (COALESCE(NULLIF(bg.nguoi_giao, ''::text), '—'::text) || ' → '::text) || COALESCE(NULLIF(bg.nguoi_nhan, ''::text), '—'::text) AS tieu_de,
    NULLIF(bg.loai_ban_giao, ''::text) AS mo_ta, 'ban_giao'::text AS nguon, bg.id AS nguon_id
   FROM ban_giao bg WHERE bg.thiet_bi_id IS NOT NULL
UNION ALL
 SELECT vd.thiet_bi_id, vd.thoi_diem, 'vong_doi'::text AS loai_su_kien,
    COALESCE(NULLIF(vd.ly_do, ''::text), 'Thay đổi trạng thái'::text) AS tieu_de,
    NULL::text AS mo_ta, 'thiet_bi_vong_doi'::text AS nguon, vd.id AS nguon_id
   FROM thiet_bi_vong_doi vd
UNION ALL
 SELECT k.thiet_bi_id, k.thoi_diem, 'kiem_ke'::text AS loai_su_kien,
    'Kiểm kê'::text AS tieu_de, NULLIF(k.tinh_trang, ''::text) AS mo_ta,
    'kiem_ke'::text AS nguon, k.id AS nguon_id
   FROM kiem_ke k;

GRANT SELECT ON public.v_ly_lich_thiet_bi TO authenticated, anon, service_role;