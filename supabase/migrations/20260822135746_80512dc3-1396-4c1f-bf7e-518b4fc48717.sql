-- Migration: Convert RPC functions to Views for Keyset Pagination compatibility (FIXED)
-- Created at: 2026-08-22 12:05:00

-- 1. Drop old functions
DROP FUNCTION IF EXISTS public.rpc_tai_san_toan_cuc();
DROP FUNCTION IF EXISTS public.rpc_thanh_phan_toan_cuc();

-- 2. Create View for Asset Overview (v_tai_san_toan_cuc)
CREATE OR REPLACE VIEW public.v_tai_san_toan_cuc WITH (security_invoker = 'on') AS
SELECT 
    t.id,
    t.ma_thiet_bi AS ma,
    t.ten_thiet_bi AS ten,
    t.ma_serial AS serial,
    m.ten AS model,
    t.model_id AS "modelId",
    l.ten AS "chungLoai",
    nsx.ten AS "nhaSanXuat",
    ncc.ten AS "nhaCungCap",
    dv.ten AS "donViQuanLy",
    tt.ten AS "trangThai",
    v.ten AS "viTri",
    (SELECT count(*)::int FROM public.gan_chuc_nang gcn WHERE gcn.thiet_bi_id = t.id AND gcn.den_ngay IS NULL) AS "soThanhPhanDangGan",
    (
        SELECT string_agg(tp.ma_thanh_phan, ', ') 
        FROM public.gan_chuc_nang gcn2
        JOIN public.he_thong_thanh_phan tp ON tp.id = gcn2.thanh_phan_id
        WHERE gcn2.thiet_bi_id = t.id AND gcn2.den_ngay IS NULL
    ) AS "danhSachThanhPhan",
    (
        SELECT string_agg(DISTINCT ht.ten, ', ')
        FROM public.gan_chuc_nang gcn3
        JOIN public.he_thong_thanh_phan tp2 ON tp2.id = gcn3.thanh_phan_id
        JOIN public.dm_he_thong ht ON ht.id = tp2.he_thong_id
        WHERE gcn3.thiet_bi_id = t.id AND gcn3.den_ngay IS NULL
    ) AS "danhSachHeThong",
    t.p_n AS "pN",
    t.ma_tai_san_bravo AS "maTaiSanBravo",
    t.nam_san_xuat AS "namSanXuat",
    t.nam_dua_vao_khai_thac AS "namKhaiThac",
    to_char(t.ngay_mua, 'DD/MM/YYYY') AS "ngayMua",
    to_char(t.han_bao_hanh, 'DD/MM/YYYY') AS "hanBaoHanh",
    t.ty_le_tuoi_tho AS "tyLeTuoiTho",
    t.tinh_trang_ky_thuat AS "tinhTrangKyThuat",
    t.che_do_kd_hc AS "cheDoKdHc",
    to_char(t.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY') AS "ngayBaoTriGanNhat",
    to_char(t.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY') AS "ngayBaoTriKeTiep",
    (SELECT count(*)::int FROM public.su_co sc WHERE sc.thiet_bi_id = t.id AND sc.ngay_phat_hien >= now() - interval '90 days') AS "soSuCo90n",
    t.ty_le_tuoi_tho AS "anomalyScore" -- Dùng ty_le_tuoi_tho làm placeholder vì anomaly_score không tồn tại
FROM public.thiet_bi t
LEFT JOIN public.dm_model m ON m.id = t.model_id
LEFT JOIN public.dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
LEFT JOIN public.dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
LEFT JOIN public.dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id
LEFT JOIN public.dm_vi_tri v ON v.id = t.vi_tri_id
LEFT JOIN public.dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id;

-- 3. Create View for System Components (v_thanh_phan_toan_cuc)
CREATE OR REPLACE VIEW public.v_thanh_phan_toan_cuc WITH (security_invoker = 'on') AS
SELECT 
    tp.id,
    tp.ma_thanh_phan AS ma,
    tp.ten,
    nht.ten AS "nhomHeThong",
    pl.ten AS "phanLoai",
    ht.ten AS "heThong",
    tp.he_thong_id AS "heThongId",
    tp.vi_tri_id AS "viTriId",
    l_req.ten AS "loaiYeuCau",
    vt.ten AS "viTri",
    CASE tp.trang_thai WHEN 'hoat_dong' THEN 'Hoạt động' WHEN 'ngung' THEN 'Đã ngừng' ELSE tp.trang_thai END AS "trangThai",
    t.ma_thiet_bi AS "thietBiMa",
    t.ten_thiet_bi AS "thietBiTen",
    t.ma_serial AS "thietBiSerial",
    m.ten AS "model",
    t.model_id AS "modelId",
    l.ten AS "chungLoai",
    nsx.ten AS "nhaSanXuat",
    ncc.ten AS "nhaCungCap",
    (gcn.thiet_bi_id IS NOT NULL) AS "daLap",
    (SELECT count(*)::int FROM public.gan_chuc_nang g2 WHERE g2.thiet_bi_id = gcn.thiet_bi_id AND g2.den_ngay IS NULL) AS "soThanhPhanCuaTaiSan",
    tt.ten AS "taiSanTrangThai",
    t.nam_san_xuat AS "namSanXuat",
    t.nam_dua_vao_khai_thac AS "namKhaiThac",
    to_char(t.ngay_mua, 'DD/MM/YYYY') AS "ngayMua",
    to_char(t.han_bao_hanh, 'DD/MM/YYYY') AS "hanBaoHanh",
    t.p_n AS "pN",
    t.ma_tai_san_bravo AS "maTaiSanBravo",
    t.ty_le_tuoi_tho AS "tyLeTuoiTho",
    t.tinh_trang_ky_thuat AS "tinhTrangKyThuat",
    to_char(t.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY') AS "ngayBaoTriGanNhat",
    to_char(t.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY') AS "ngayBaoTriKeTiep",
    t.che_do_kd_hc AS "cheDoKdHc",
    vt_t.ten AS "taiSanViTri",
    dv.ten AS "taiSanDonViQuanLy",
    t.ty_le_tuoi_tho AS "anomalyScore" -- Dùng ty_le_tuoi_tho làm placeholder
FROM public.he_thong_thanh_phan tp
JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
JOIN public.dm_nhom_he_thong nht ON nht.id = ht.nhom_he_thong_id
LEFT JOIN public.dm_phan_loai pl ON pl.id = ht.phan_loai_id
LEFT JOIN public.dm_loai_thiet_bi l_req ON l_req.id = tp.loai_thiet_bi_yeu_cau
LEFT JOIN public.dm_vi_tri vt ON vt.id = tp.vi_tri_id
LEFT JOIN public.gan_chuc_nang gcn ON gcn.thanh_phan_id = tp.id AND gcn.den_ngay IS NULL
LEFT JOIN public.thiet_bi t ON t.id = gcn.thiet_bi_id
LEFT JOIN public.dm_model m ON m.id = t.model_id
LEFT JOIN public.dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
LEFT JOIN public.dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
LEFT JOIN public.dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id
LEFT JOIN public.dm_vi_tri vt_t ON vt_t.id = t.vi_tri_id
LEFT JOIN public.dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id
WHERE tp.deleted_at IS NULL;

-- 4. Grants
GRANT SELECT ON public.v_tai_san_toan_cuc TO authenticated;
GRANT SELECT ON public.v_tai_san_toan_cuc TO service_role;
GRANT SELECT ON public.v_thanh_phan_toan_cuc TO authenticated;
GRANT SELECT ON public.v_thanh_phan_toan_cuc TO service_role;