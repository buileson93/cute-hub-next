-- ============================================================================
-- Pilot VHF–VCCS: external-entity fields + demo seed (idempotent)
-- ============================================================================

-- 1) External-entity fields on dm_he_thong (nội bộ vs bên ngoài)
ALTER TABLE public.dm_he_thong
  ADD COLUMN IF NOT EXISTS pham_vi_quan_ly text NOT NULL DEFAULT 'noi_bo',
  ADD COLUMN IF NOT EXISTS to_chuc_so_huu text;

-- 2) Expose external flags on the graph view (append columns at the end)
CREATE OR REPLACE VIEW public.v_do_thi_he_thong AS
 SELECT lk.id,
    lk.he_thong_nguon_id AS nguon_id,
    hn.ten AS nguon_ten,
    nhn.ten AS nguon_nhom,
    dvn.ten AS nguon_don_vi,
    lk.he_thong_dich_id AS dich_id,
    hd.ten AS dich_ten,
    nhd.ten AS dich_nhom,
    dvd.ten AS dich_don_vi,
    lk.loai_lien_ket_id,
    llk.ma AS loai_ma,
    llk.ten AS loai_ten,
    llk.mau_sac,
    llk.kieu_net,
    llk.co_huong,
    lk.lop,
    lk.huong,
    lk.vai_tro_du_phong,
    lk.giao_dien_nguon,
    lk.giao_dien_dich,
    lk.giao_thuc,
    lk.trang_thai,
    lk.don_vi_id_snapshot,
    (hn.pham_vi_quan_ly = 'ben_ngoai') AS nguon_ben_ngoai,
    hn.to_chuc_so_huu AS nguon_to_chuc,
    (hd.pham_vi_quan_ly = 'ben_ngoai') AS dich_ben_ngoai,
    hd.to_chuc_so_huu AS dich_to_chuc
   FROM lien_ket_he_thong lk
     JOIN dm_he_thong hn ON hn.id = lk.he_thong_nguon_id
     JOIN dm_he_thong hd ON hd.id = lk.he_thong_dich_id
     JOIN dm_loai_lien_ket llk ON llk.id = lk.loai_lien_ket_id
     LEFT JOIN dm_nhom_he_thong nhn ON nhn.id = hn.nhom_he_thong_id
     LEFT JOIN dm_nhom_he_thong nhd ON nhd.id = hd.nhom_he_thong_id
     LEFT JOIN dm_don_vi dvn ON dvn.id = hn.don_vi_id
     LEFT JOIN dm_don_vi dvd ON dvd.id = hd.don_vi_id
  WHERE lk.hieu_luc_den IS NULL;

-- 3) Seed hệ thống pilot (idempotent theo mã). Các hệ thống đã có sẽ được bỏ qua.
INSERT INTO public.dm_he_thong (ma, ten, mo_ta, pham_vi_quan_ly, to_chuc_so_huu, thu_tu)
VALUES
  ('VHF', 'Hệ thống VHF', 'Hệ thống thoại VHF (Đà Nẵng)', 'noi_bo', NULL, 10),
  ('VCCS', 'Hệ thống VCCS', 'Hệ thống chuyển mạch thoại VCCS (Đà Nẵng)', 'noi_bo', NULL, 11),
  ('HE_THONG_GHI_AM', 'Hệ thống ghi âm', 'Hệ thống ghi âm thoại/tần số', 'noi_bo', NULL, 12),
  ('DONG_HO_CHUAN_THOI_GIAN', 'Đồng hồ chuẩn thời gian', 'Nguồn thời gian chuẩn (NTP/GPS) cấp cho các hệ thống', 'noi_bo', NULL, 13),
  ('MANG_THOAI_SAN_BAY_ACV', 'Mạng thoại sân bay (ACV)', 'Hệ thống thoại thuộc quản lý bên ngoài (ACV)', 'ben_ngoai', 'ACV', 14)
ON CONFLICT (ma) DO NOTHING;

-- 4) Seed liên kết pilot (idempotent theo cạnh đang hiệu lực)
WITH ht AS (SELECT ma, id FROM public.dm_he_thong),
     lt AS (SELECT ma, id FROM public.dm_loai_lien_ket),
     seed(nguon_ma, dich_ma, loai_ma, lop, huong, gd_nguon, gd_dich, giao_thuc, vai_tro, mo_ta) AS (
       VALUES
         ('VHF','VCCS','LUONG_TIN_HIEU','logic','hai_chieu',NULL,NULL,NULL,'chinh','Luồng thoại VHF định tuyến qua VCCS'),
         ('VHF','VCCS','DAU_NOI_VAT_LY','vat_ly','hai_chieu','E1','IP','E1/IP',NULL,'Đấu nối vật lý VHF-VCCS'),
         ('VCCS','HE_THONG_GHI_AM','PHU_THUOC_DICH_VU','logic','mot_chieu',NULL,NULL,NULL,NULL,'VCCS cấp luồng thoại cho hệ thống ghi âm'),
         ('DONG_HO_CHUAN_THOI_GIAN','VCCS','PHU_THUOC_DICH_VU','logic','mot_chieu',NULL,NULL,'NTP',NULL,'Đồng bộ thời gian chuẩn cho VCCS'),
         ('VCCS','MANG_THOAI_SAN_BAY_ACV','LUONG_TIN_HIEU','logic','hai_chieu',NULL,NULL,NULL,NULL,'Kết nối thoại ra mạng sân bay (ACV)'),
         ('VHF','VCCS','DU_PHONG','logic','hai_chieu',NULL,NULL,NULL,'du_phong','Tuyến dự phòng cho kết nối VHF-VCCS')
     )
INSERT INTO public.lien_ket_he_thong
  (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop, huong,
   giao_dien_nguon, giao_dien_dich, giao_thuc, vai_tro_du_phong, mo_ta_tin_hieu,
   trang_thai, hieu_luc_tu)
SELECT hn.id, hd.id, l.id, s.lop, s.huong,
       s.gd_nguon, s.gd_dich, s.giao_thuc, s.vai_tro, s.mo_ta,
       'hoat_dong', CURRENT_DATE
FROM seed s
JOIN ht hn ON hn.ma = s.nguon_ma
JOIN ht hd ON hd.ma = s.dich_ma
JOIN lt l ON l.ma = s.loai_ma
ON CONFLICT (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop)
  WHERE hieu_luc_den IS NULL
  DO NOTHING;

-- 5) Bổ sung metadata cho cạnh chính VHF-VCCS đã tồn tại (giao diện / vai trò)
UPDATE public.lien_ket_he_thong lk
SET giao_dien_nguon = COALESCE(lk.giao_dien_nguon, 'E1'),
    giao_dien_dich  = COALESCE(lk.giao_dien_dich, 'IP'),
    giao_thuc       = COALESCE(lk.giao_thuc, 'E1/IP')
FROM public.dm_he_thong hn, public.dm_he_thong hd, public.dm_loai_lien_ket llk
WHERE lk.he_thong_nguon_id = hn.id AND hn.ma = 'VHF'
  AND lk.he_thong_dich_id = hd.id AND hd.ma = 'VCCS'
  AND lk.loai_lien_ket_id = llk.id AND llk.ma = 'DAU_NOI_VAT_LY'
  AND lk.hieu_luc_den IS NULL;

UPDATE public.lien_ket_he_thong lk
SET vai_tro_du_phong = COALESCE(lk.vai_tro_du_phong, 'chinh')
FROM public.dm_he_thong hn, public.dm_he_thong hd, public.dm_loai_lien_ket llk
WHERE lk.he_thong_nguon_id = hn.id AND hn.ma = 'VHF'
  AND lk.he_thong_dich_id = hd.id AND hd.ma = 'VCCS'
  AND lk.loai_lien_ket_id = llk.id AND llk.ma = 'LUONG_TIN_HIEU'
  AND lk.hieu_luc_den IS NULL;