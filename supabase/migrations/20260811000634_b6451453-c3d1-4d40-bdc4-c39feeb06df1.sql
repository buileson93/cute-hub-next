-- Drop existing functions because the return type (implied by JSON keys) changed
DROP FUNCTION IF EXISTS public.rpc_tai_san_toan_cuc();
DROP FUNCTION IF EXISTS public.rpc_thanh_phan_toan_cuc();

-- Recreate rpc_tai_san_toan_cuc to include modelId
CREATE OR REPLACE FUNCTION public.rpc_tai_san_toan_cuc()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', t.id,
      'ma', t.ma_thiet_bi,
      'ten', t.ten_thiet_bi,
      'serial', t.ma_serial,
      'model', m.ten,
      'modelId', t.model_id, -- Added modelId
      'chungLoai', l.ten,
      'nhaSanXuat', nsx.ten,
      'nhaCungCap', ncc.ten,
      'donViQuanLy', dv.ten,
      'trangThai', t.trang_thai,
      'viTri', v.ten,
      'soThanhPhanDangGan', (SELECT count(*)::int FROM thiet_bi_thanh_phan tp WHERE tp.thiet_bi_id = t.id),
      'danhSachThanhPhan', (
        SELECT string_agg(tp.ma_thanh_phan, ', ') 
        FROM thiet_bi_thanh_phan tp 
        WHERE tp.thiet_bi_id = t.id
      ),
      'danhSachHeThong', (
        SELECT string_agg(DISTINCT ht.ten, ', ')
        FROM thiet_bi_thanh_phan tp
        JOIN dm_he_thong ht ON ht.id = tp.he_thong_id
        WHERE tp.thiet_bi_id = t.id
      ),
      'pN', t.p_n,
      'maTaiSanBravo', t.ma_tai_san_bravo,
      'namSanXuat', t.nam_san_xuat,
      'namKhaiThac', t.nam_dua_vao_khai_thac,
      'ngayMua', t.ngay_mua,
      'hanBaoHanh', t.han_bao_hanh,
      'tyLeTuoiTho', t.ty_le_tuoi_tho,
      'tinhTrangKyThuat', t.tinh_trang_ky_thuat,
      'cheDoKdHc', t.che_do_kd_hc,
      'ngayBaoTriGanNhat', t.ngay_bao_tri_gan_nhat,
      'ngayBaoTriKeTiep', t.ngay_bao_tri_ke_tiep,
      'soSuCo90n', (SELECT count(*)::int FROM su_co sc WHERE sc.thiet_bi_id = t.id AND sc.ngay_phat_hien >= now() - interval '90 days'),
      'anomalyScore', t.anomaly_score
    )
  FROM thiet_bi t
  LEFT JOIN dm_model m ON m.id = t.model_id
  LEFT JOIN dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
  LEFT JOIN dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
  LEFT JOIN dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
  LEFT JOIN dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id
  LEFT JOIN dm_vi_tri v ON v.id = t.vi_tri_id;
END;
$function$;

-- Recreate rpc_thanh_phan_toan_cuc to include modelId
CREATE OR REPLACE FUNCTION public.rpc_thanh_phan_toan_cuc()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', tp.id,
      'ma', tp.ma_thanh_phan,
      'ten', tp.ten_thanh_phan,
      'nhomHeThong', nht.ten,
      'phanLoai', pl.ten,
      'heThong', ht.ten,
      'heThongId', tp.he_thong_id,
      'viTriId', tp.vi_tri_id,
      'loaiYeuCau', lyc.ten,
      'viTri', vt.ten,
      'trangThai', tp.trang_thai,
      'thietBiMa', t.ma_thiet_bi,
      'thietBiTen', t.ten_thiet_bi,
      'thietBiSerial', t.ma_serial,
      'model', m.ten,
      'modelId', t.model_id, -- Added modelId (inherited from asset)
      'chungLoai', l.ten,
      'nhaSanXuat', nsx.ten,
      'nhaCungCap', ncc.ten,
      'daLap', (tp.thiet_bi_id IS NOT NULL),
      'soThanhPhanCuaTaiSan', (SELECT count(*)::int FROM thiet_bi_thanh_phan tp2 WHERE tp2.thiet_bi_id = tp.thiet_bi_id),
      'taiSanTrangThai', t.trang_thai,
      'namSanXuat', t.nam_san_xuat,
      'namKhaiThac', t.nam_dua_vao_khai_thac,
      'ngayMua', t.ngay_mua,
      'hanBaoHanh', t.han_bao_hanh,
      'pN', t.p_n,
      'maTaiSanBravo', t.ma_tai_san_bravo,
      'tyLeTuoiTho', t.ty_le_tuoi_tho,
      'tinhTrangKyThuat', t.tinh_trang_ky_thuat,
      'ngayBaoTriGanNhat', t.ngay_bao_tri_gan_nhat,
      'ngayBaoTriKeTiep', t.ngay_bao_tri_ke_tiep,
      'cheDoKdHc', t.che_do_kd_hc,
      'taiSanViTri', vt_t.ten,
      'taiSanDonViQuanLy', dv.ten
    )
  FROM thiet_bi_thanh_phan tp
  JOIN dm_he_thong ht ON ht.id = tp.he_thong_id
  JOIN dm_nhom_he_thong nht ON nht.id = ht.nhom_he_thong_id
  LEFT JOIN dm_phan_loai_he_thong pl ON pl.id = ht.phan_loai_id
  LEFT JOIN dm_loai_yeu_cau_thanh_phan lyc ON lyc.id = tp.loai_yeu_cau_id
  LEFT JOIN dm_vi_tri vt ON vt.id = tp.vi_tri_id
  LEFT JOIN thiet_bi t ON t.id = tp.thiet_bi_id
  LEFT JOIN dm_model m ON m.id = t.model_id
  LEFT JOIN dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
  LEFT JOIN dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
  LEFT JOIN dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
  LEFT JOIN dm_vi_tri vt_t ON vt_t.id = t.vi_tri_id
  LEFT JOIN dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id;
END;
$function$;
