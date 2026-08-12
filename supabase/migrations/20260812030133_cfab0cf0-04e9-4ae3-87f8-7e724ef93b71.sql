CREATE OR REPLACE FUNCTION public.rpc_tai_san_toan_cuc()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
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
      'modelId', t.model_id,
      'chungLoai', l.ten,
      'nhaSanXuat', nsx.ten,
      'nhaCungCap', ncc.ten,
      'donViQuanLy', dv.ten,
      'trangThai', tt.ten,
      'viTri', v.ten,
      'soThanhPhanDangGan', (SELECT count(*)::int FROM gan_chuc_nang gcn WHERE gcn.thiet_bi_id = t.id AND gcn.den_ngay IS NULL),
      'danhSachThanhPhan', (
        SELECT string_agg(tp.ma_thanh_phan, ', ') 
        FROM gan_chuc_nang gcn2
        JOIN he_thong_thanh_phan tp ON tp.id = gcn2.thanh_phan_id
        WHERE gcn2.thiet_bi_id = t.id AND gcn2.den_ngay IS NULL
      ),
      'danhSachHeThong', (
        SELECT string_agg(DISTINCT ht.ten, ', ')
        FROM gan_chuc_nang gcn3
        JOIN he_thong_thanh_phan tp2 ON tp2.id = gcn3.thanh_phan_id
        JOIN dm_he_thong ht ON ht.id = tp2.he_thong_id
        WHERE gcn3.thiet_bi_id = t.id AND gcn3.den_ngay IS NULL
      ),
      'pN', t.p_n,
      'maTaiSanBravo', t.ma_tai_san_bravo,
      'namSanXuat', t.nam_san_xuat,
      'namKhaiThac', t.nam_dua_vao_khai_thac,
      'ngayMua', to_char(t.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(t.han_bao_hanh, 'DD/MM/YYYY'),
      'tyLeTuoiTho', t.ty_le_tuoi_tho,
      'tinhTrangKyThuat', t.tinh_trang_ky_thuat,
      'cheDoKdHc', t.che_do_kd_hc,
      'ngayBaoTriGanNhat', to_char(t.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(t.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'soSuCo90n', COALESCE(ma.incident_count_90d, 0),
      'anomalyScore', COALESCE(ma.z_score, 0)
    )
  FROM thiet_bi t
  LEFT JOIN dm_model m ON m.id = t.model_id
  LEFT JOIN dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
  LEFT JOIN dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
  LEFT JOIN dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
  LEFT JOIN dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id
  LEFT JOIN dm_vi_tri v ON v.id = t.vi_tri_id
  LEFT JOIN dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id
  LEFT JOIN mv_asset_anomaly ma ON ma.asset_id = t.id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_thanh_phan_toan_cuc()
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    jsonb_build_object(
      'id', tp.id,
      'ma', tp.ma_thanh_phan,
      'ten', tp.ten,
      'nhomHeThong', nht.ten,
      'phanLoai', pl.ten,
      'heThong', ht.ten,
      'heThongId', tp.he_thong_id,
      'viTriId', tp.vi_tri_id,
      'loaiYeuCau', l_req.ten,
      'viTri', vt.ten,
      'trangThai', CASE tp.trang_thai WHEN 'hoat_dong' THEN 'Hoạt động' WHEN 'ngung' THEN 'Đã ngừng' ELSE tp.trang_thai END,
      'thietBiMa', t.ma_thiet_bi,
      'thietBiTen', t.ten_thiet_bi,
      'thietBiSerial', t.ma_serial,
      'model', m.ten,
      'modelId', t.model_id,
      'chungLoai', l.ten,
      'nhaSanXuat', nsx.ten,
      'nhaCungCap', ncc.ten,
      'daLap', (gcn.thiet_bi_id IS NOT NULL),
      'soThanhPhanCuaTaiSan', (SELECT count(*)::int FROM gan_chuc_nang g2 WHERE g2.thiet_bi_id = gcn.thiet_bi_id AND g2.den_ngay IS NULL),
      'taiSanTrangThai', tt.ten,
      'namSanXuat', t.nam_san_xuat,
      'namKhaiThac', t.nam_dua_vao_khai_thac,
      'ngayMua', to_char(t.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(t.han_bao_hanh, 'DD/MM/YYYY'),
      'pN', t.p_n,
      'maTaiSanBravo', t.ma_tai_san_bravo,
      'tyLeTuoiTho', t.ty_le_tuoi_tho,
      'tinhTrangKyThuat', t.tinh_trang_ky_thuat,
      'ngayBaoTriGanNhat', to_char(t.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(t.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'cheDoKdHc', t.che_do_kd_hc,
      'taiSanViTri', vt_t.ten,
      'taiSanDonViQuanLy', dv.ten,
      'anomalyScore', COALESCE(ma.z_score, 0)
    )
  FROM he_thong_thanh_phan tp
  JOIN dm_he_thong ht ON ht.id = tp.he_thong_id
  JOIN dm_nhom_he_thong nht ON nht.id = ht.nhom_he_thong_id
  LEFT JOIN dm_phan_loai pl ON pl.id = ht.phan_loai_id
  LEFT JOIN dm_loai_thiet_bi l_req ON l_req.id = tp.loai_thiet_bi_yeu_cau
  LEFT JOIN dm_vi_tri vt ON vt.id = tp.vi_tri_id
  LEFT JOIN gan_chuc_nang gcn ON gcn.thanh_phan_id = tp.id AND gcn.den_ngay IS NULL
  LEFT JOIN thiet_bi t ON t.id = gcn.thiet_bi_id
  LEFT JOIN dm_model m ON m.id = t.model_id
  LEFT JOIN dm_loai_thiet_bi l ON l.id = t.loai_thiet_bi_id
  LEFT JOIN dm_nha_san_xuat nsx ON nsx.id = t.nha_san_xuat_id
  LEFT JOIN dm_nha_san_xuat ncc ON ncc.id = t.nha_cung_cap_id
  LEFT JOIN dm_trang_thai_thiet_bi tt ON tt.id = t.trang_thai_id
  LEFT JOIN dm_vi_tri vt_t ON vt_t.id = t.vi_tri_id
  LEFT JOIN dm_don_vi dv ON dv.id = t.don_vi_quan_ly_id
  LEFT JOIN mv_asset_anomaly ma ON ma.asset_id = t.id
  WHERE tp.deleted_at IS NULL;
END;
$function$;