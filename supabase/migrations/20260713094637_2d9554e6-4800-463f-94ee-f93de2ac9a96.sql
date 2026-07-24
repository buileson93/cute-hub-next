-- Bổ sung các cột THẬT còn thiếu để mọi trường khai trong trình sửa Hệ thống/Thiết bị
-- được lưu thẳng vào CSDL (thay vì chỉ lưu ở lớp phủ cay_node_edit).

-- dm_he_thong: tính năng kỹ thuật & tên giấy phép khai thác (dạng chữ)
ALTER TABLE public.dm_he_thong
  ADD COLUMN IF NOT EXISTS tinh_nang_ky_thuat text,
  ADD COLUMN IF NOT EXISTS giay_phep_khai_thac text;

-- thiet_bi: tình trạng kỹ thuật (dạng chữ, khác trang_thai_id)
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS tinh_trang_ky_thuat text;

-- Chuyển dữ liệu đã khai trước đây từ lớp phủ cay_node_edit sang cột thật.
-- Hệ thống: mã trên cây là "<mã nhóm>::<id hệ thống>" → lấy phần id (uuid) sau '::'.
UPDATE public.dm_he_thong h SET
  muc_dich_gp            = COALESCE(NULLIF(h.muc_dich_gp, ''),            NULLIF(e.du_lieu->>'muc_dich', '')),
  pham_vi_hoat_dong_gp   = COALESCE(NULLIF(h.pham_vi_hoat_dong_gp, ''),   NULLIF(e.du_lieu->>'pham_vi', '')),
  kieu_thiet_bi_gp       = COALESCE(NULLIF(h.kieu_thiet_bi_gp, ''),       NULLIF(e.du_lieu->>'kieu_thiet_bi', '')),
  nam_sx_theo_gp         = COALESCE(NULLIF(h.nam_sx_theo_gp, ''),         NULLIF(e.du_lieu->>'nam_san_xuat', '')),
  noi_san_xuat_gp        = COALESCE(NULLIF(h.noi_san_xuat_gp, ''),        NULLIF(e.du_lieu->>'noi_san_xuat', '')),
  tinh_nang_ky_thuat     = COALESCE(NULLIF(h.tinh_nang_ky_thuat, ''),     NULLIF(e.du_lieu->>'tinh_nang_ky_thuat', '')),
  dia_diem_dat_gp        = COALESCE(NULLIF(h.dia_diem_dat_gp, ''),        NULLIF(e.du_lieu->>'dia_diem_dat', '')),
  thoi_gian_hoat_dong_gp = COALESCE(NULLIF(h.thoi_gian_hoat_dong_gp, ''), NULLIF(e.du_lieu->>'thoi_gian_hoat_dong', '')),
  mo_ta                  = COALESCE(NULLIF(h.mo_ta, ''),                  NULLIF(e.du_lieu->>'ghi_chu_ht', '')),
  giay_phep_khai_thac    = COALESCE(NULLIF(h.giay_phep_khai_thac, ''),    NULLIF(e.du_lieu->>'giay_phep_khai_thac', '')),
  gp_so                  = COALESCE(NULLIF(h.gp_so, ''),                  NULLIF(e.du_lieu->>'so_gp', '')),
  gp_han                 = COALESCE(NULLIF(h.gp_han, ''),                 NULLIF(e.du_lieu->>'ngay_het_han_gp', ''))
FROM public.cay_node_edit e
WHERE e.kind = 'ht'
  AND h.id::text = split_part(e.ma, '::', 2)
  AND e.du_lieu IS NOT NULL;

-- Thiết bị: mã trên cây chính là ma_thiet_bi.
UPDATE public.thiet_bi t SET
  tinh_trang_ky_thuat = COALESCE(NULLIF(t.tinh_trang_ky_thuat, ''), NULLIF(e.du_lieu->>'tinh_trang_ky_thuat', '')),
  ghi_chu             = COALESCE(NULLIF(t.ghi_chu, ''),             NULLIF(e.du_lieu->>'ghi_chu', ''))
FROM public.cay_node_edit e
WHERE e.kind = 'tb'
  AND t.ma_thiet_bi = e.ma
  AND e.du_lieu IS NOT NULL;