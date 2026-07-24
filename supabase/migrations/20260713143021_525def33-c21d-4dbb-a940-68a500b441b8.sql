-- ============================================================================
-- MÔ HÌNH 3 LỚP — BƯỚC 7: read model "Lý lịch" (security_invoker -> theo RLS).
-- ============================================================================

-- (1) LÝ LỊCH HỆ THỐNG: lịch sử lắp đặt theo từng vị trí chức năng.
CREATE OR REPLACE VIEW public.v_ly_lich_vi_tri_chuc_nang
WITH (security_invoker = on) AS
SELECT
  g.thanh_phan_id,
  tp.he_thong_id,
  tp.ma_thanh_phan,
  tp.ten                         AS ten_vi_tri,
  g.id                           AS gan_id,
  g.thiet_bi_id,
  t.ma_thiet_bi,
  COALESCE(t.ten_thiet_bi, t.ma_thiet_bi) AS ten_thiet_bi,
  t.ma_serial,
  g.tu_ngay,
  g.den_ngay,
  g.ly_do,
  g.hong_hoc_id,
  g.nguoi_thuc_hien,
  g.ghi_chu
FROM public.gan_chuc_nang g
JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
JOIN public.thiet_bi t             ON t.id = g.thiet_bi_id
ORDER BY g.thanh_phan_id, g.tu_ngay;

GRANT SELECT ON public.v_ly_lich_vi_tri_chuc_nang TO authenticated, service_role;

-- (2) LÝ LỊCH THIẾT BỊ: hợp nhất mọi nguồn theo thời gian.
CREATE OR REPLACE VIEW public.v_ly_lich_thiet_bi
WITH (security_invoker = on) AS
-- Lắp vào vị trí chức năng.
SELECT g.thiet_bi_id, g.tu_ngay AS thoi_diem, 'lap'::text AS loai_su_kien,
       'Lắp vào vị trí: ' || tp.ten AS tieu_de,
       NULLIF(g.ghi_chu,'') AS mo_ta, 'gan_chuc_nang'::text AS nguon, g.id AS nguon_id
FROM public.gan_chuc_nang g
JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
UNION ALL
-- Rời vị trí (khi dòng gán được đóng).
SELECT g.thiet_bi_id, g.den_ngay AS thoi_diem, 'roi_vi_tri'::text,
       'Rời vị trí: ' || tp.ten || ' (' || g.ly_do || ')',
       NULLIF(g.ghi_chu,''), 'gan_chuc_nang', g.id
FROM public.gan_chuc_nang g
JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
WHERE g.den_ngay IS NOT NULL
UNION ALL
-- Hỏng hóc / thay thế.
SELECT h.thiet_bi_hong_id, h.ngay_hong::timestamptz, 'hong_hoc',
       COALESCE(NULLIF(h.mo_ta_hong_hoc,''), NULLIF(h.bo_phan_hong,''), 'Hỏng hóc'),
       NULLIF(h.phuong_an,''), 'hong_hoc', h.id
FROM public.hong_hoc h WHERE h.thiet_bi_hong_id IS NOT NULL
UNION ALL
-- Bảo dưỡng.
SELECT b.thiet_bi_id, b.ngay_bat_dau::timestamptz, 'bao_tri',
       COALESCE(NULLIF(b.mo_ta_cong_viec,''), NULLIF(b.loai_bao_tri,''), 'Bảo dưỡng'),
       NULLIF(b.ket_qua,''), 'bao_tri', b.id
FROM public.bao_tri b WHERE b.thiet_bi_id IS NOT NULL
UNION ALL
-- Sự cố.
SELECT s.thiet_bi_id, s.ngay_phat_hien::timestamptz, 'su_co',
       COALESCE(NULLIF(s.hien_tuong,''), 'Sự cố'),
       NULLIF(s.muc_do,''), 'su_co', s.id
FROM public.su_co s WHERE s.thiet_bi_id IS NOT NULL
UNION ALL
-- Bàn giao.
SELECT bg.thiet_bi_id, bg.ngay_nhan::timestamptz, 'ban_giao',
       COALESCE(NULLIF(bg.nguoi_giao,''),'—') || ' → ' || COALESCE(NULLIF(bg.nguoi_nhan,''),'—'),
       NULLIF(bg.loai_ban_giao,''), 'ban_giao', bg.id
FROM public.ban_giao bg WHERE bg.thiet_bi_id IS NOT NULL
UNION ALL
-- Thay đổi trạng thái vòng đời.
SELECT vd.thiet_bi_id, vd.thoi_diem, 'vong_doi',
       COALESCE(NULLIF(vd.ly_do,''), 'Thay đổi trạng thái'),
       NULL, 'thiet_bi_vong_doi', vd.id
FROM public.thiet_bi_vong_doi vd
UNION ALL
-- Kiểm kê.
SELECT k.thiet_bi_id, k.thoi_diem, 'kiem_ke', 'Kiểm kê',
       NULLIF(k.tinh_trang,''), 'kiem_ke', k.id
FROM public.kiem_ke k;

GRANT SELECT ON public.v_ly_lich_thiet_bi TO authenticated, service_role;