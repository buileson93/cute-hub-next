
-- ============================================================
-- rpc_thanh_phan_toan_cuc: 1 dòng / thành phần + tài sản đang lắp
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_thanh_phan_toan_cuc()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH mount_active AS (
    SELECT g.thanh_phan_id, g.thiet_bi_id
    FROM public.gan_chuc_nang g
    WHERE g.den_ngay IS NULL
  ),
  cnt_by_tb AS (
    SELECT thiet_bi_id, count(*)::int AS n
    FROM mount_active GROUP BY thiet_bi_id
  ),
  rows AS (
    SELECT jsonb_build_object(
      'id', tp.id,
      'ma', COALESCE(tp.ma_thanh_phan,''),
      'ten', COALESCE(tp.ten,''),
      'nhomHeThong', COALESCE(nh.ten,''),
      'phanLoai', COALESCE(pl.ten,''),
      'heThong', COALESCE(ht.ten,'—'),
      'heThongId', COALESCE(tp.he_thong_id::text,''),
      'viTriId', tp.vi_tri_id,
      'loaiYeuCau', COALESCE(loai_req.ten,''),
      'viTri', COALESCE(vt.ten,''),
      'trangThai', CASE tp.trang_thai WHEN 'hoat_dong' THEN 'Hoạt động' WHEN 'ngung' THEN 'Đã ngừng' ELSE COALESCE(tp.trang_thai,'') END,
      'thietBiMa', COALESCE(tb.ma_thiet_bi,''),
      'thietBiTen', COALESCE(tb.ten_thiet_bi,''),
      'thietBiSerial', COALESCE(tb.ma_serial,''),
      'model', COALESCE(mdl.ten, tb.model, ''),
      'chungLoai', COALESCE(loai_tb.ten,''),
      'nhaSanXuat', COALESCE(nsx.ten,''),
      'nhaCungCap', COALESCE(ncc.ten,''),
      'daLap', tb.id IS NOT NULL,
      'soThanhPhanCuaTaiSan', COALESCE(cnt.n, 0),
      'taiSanTrangThai', COALESCE(tb_tt.ten,''),
      'namSanXuat', COALESCE(tb.nam_san_xuat::text,''),
      'namKhaiThac', COALESCE(tb.nam_dua_vao_khai_thac::text,''),
      'ngayMua', to_char(tb.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(tb.han_bao_hanh, 'DD/MM/YYYY'),
      'pN', COALESCE(tb.p_n,''),
      'maTaiSanBravo', COALESCE(tb.ma_tai_san_bravo,''),
      'tyLeTuoiTho', CASE WHEN tb.ty_le_tuoi_tho IS NOT NULL THEN round(tb.ty_le_tuoi_tho)::text || '%' ELSE '' END,
      'tinhTrangKyThuat', COALESCE(tb.tinh_trang_ky_thuat,''),
      'ngayBaoTriGanNhat', to_char(tb.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(tb.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'cheDoKdHc', COALESCE(tb.che_do_kd_hc,''),
      'taiSanViTri', COALESCE(tb_vt.ten,''),
      'taiSanDonViQuanLy', COALESCE(tb_dv.ten,'')
    ) AS r
    FROM public.he_thong_thanh_phan tp
    LEFT JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
    LEFT JOIN public.dm_nhom_he_thong nh ON nh.id = ht.nhom_he_thong_id
    LEFT JOIN public.dm_phan_loai pl ON pl.id = ht.phan_loai_id
    LEFT JOIN public.dm_loai_thiet_bi loai_req ON loai_req.id = tp.loai_thiet_bi_yeu_cau
    LEFT JOIN public.dm_vi_tri vt ON vt.id = tp.vi_tri_id
    LEFT JOIN mount_active ma ON ma.thanh_phan_id = tp.id
    LEFT JOIN public.thiet_bi tb ON tb.id = ma.thiet_bi_id
    LEFT JOIN cnt_by_tb cnt ON cnt.thiet_bi_id = tb.id
    LEFT JOIN public.dm_model mdl ON mdl.id = tb.model_id
    LEFT JOIN public.dm_loai_thiet_bi loai_tb ON loai_tb.id = tb.loai_thiet_bi_id
    LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
    LEFT JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
    LEFT JOIN public.dm_trang_thai_thiet_bi tb_tt ON tb_tt.id = tb.trang_thai_id
    LEFT JOIN public.dm_vi_tri tb_vt ON tb_vt.id = tb.vi_tri_id
    LEFT JOIN public.dm_don_vi tb_dv ON tb_dv.id = tb.don_vi_quan_ly_id
    WHERE tp.deleted_at IS NULL
    ORDER BY tp.ma_thanh_phan
  )
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM rows;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_thanh_phan_toan_cuc() TO authenticated, service_role;

-- ============================================================
-- rpc_tai_san_toan_cuc: 1 dòng / tài sản + tổng hợp thành phần
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_tai_san_toan_cuc()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH mounts AS (
    SELECT g.thiet_bi_id,
           COALESCE(ht.ten,'') AS ht,
           COALESCE(tp.ten,'') AS tp
    FROM public.gan_chuc_nang g
    JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
    LEFT JOIN public.dm_he_thong ht ON ht.id = tp.he_thong_id
    WHERE g.den_ngay IS NULL
  ),
  agg AS (
    SELECT thiet_bi_id,
           count(*)::int AS so_tp,
           string_agg(NULLIF(trim(ht || ' · ' || tp),'· '), E'\n') AS ds_tp,
           string_agg(DISTINCT NULLIF(ht,''), ', ') AS ds_ht
    FROM mounts GROUP BY thiet_bi_id
  ),
  rows AS (
    SELECT jsonb_build_object(
      'id', tb.id,
      'ma', COALESCE(tb.ma_thiet_bi,''),
      'ten', COALESCE(tb.ten_thiet_bi,''),
      'serial', COALESCE(tb.ma_serial,''),
      'model', COALESCE(mdl.ten, tb.model, ''),
      'chungLoai', COALESCE(loai_tb.ten,''),
      'nhaSanXuat', COALESCE(nsx.ten,''),
      'nhaCungCap', COALESCE(ncc.ten,''),
      'donViQuanLy', COALESCE(dv.ten,''),
      'trangThai', COALESCE(tt.ten,''),
      'viTri', COALESCE(vt.ten,''),
      'soThanhPhanDangGan', COALESCE(a.so_tp, 0),
      'danhSachThanhPhan', COALESCE(a.ds_tp,''),
      'danhSachHeThong', COALESCE(a.ds_ht,''),
      'pN', COALESCE(tb.p_n,''),
      'maTaiSanBravo', COALESCE(tb.ma_tai_san_bravo,''),
      'namSanXuat', COALESCE(tb.nam_san_xuat::text,''),
      'namKhaiThac', COALESCE(tb.nam_dua_vao_khai_thac::text,''),
      'ngayMua', to_char(tb.ngay_mua, 'DD/MM/YYYY'),
      'hanBaoHanh', to_char(tb.han_bao_hanh, 'DD/MM/YYYY'),
      'tyLeTuoiTho', CASE WHEN tb.ty_le_tuoi_tho IS NOT NULL THEN round(tb.ty_le_tuoi_tho)::text || '%' ELSE '' END,
      'tinhTrangKyThuat', COALESCE(tb.tinh_trang_ky_thuat,''),
      'cheDoKdHc', COALESCE(tb.che_do_kd_hc,''),
      'ngayBaoTriGanNhat', to_char(tb.ngay_bao_tri_gan_nhat, 'DD/MM/YYYY'),
      'ngayBaoTriKeTiep', to_char(tb.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY')
    ) AS r
    FROM public.thiet_bi tb
    LEFT JOIN public.dm_model mdl ON mdl.id = tb.model_id
    LEFT JOIN public.dm_loai_thiet_bi loai_tb ON loai_tb.id = tb.loai_thiet_bi_id
    LEFT JOIN public.dm_nha_san_xuat nsx ON nsx.id = tb.nha_san_xuat_id
    LEFT JOIN public.dm_nha_cung_cap ncc ON ncc.id = tb.nha_cung_cap_id
    LEFT JOIN public.dm_don_vi dv ON dv.id = tb.don_vi_quan_ly_id
    LEFT JOIN public.dm_trang_thai_thiet_bi tt ON tt.id = tb.trang_thai_id
    LEFT JOIN public.dm_vi_tri vt ON vt.id = tb.vi_tri_id
    LEFT JOIN agg a ON a.thiet_bi_id = tb.id
    ORDER BY tb.ma_thiet_bi
  )
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM rows;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_tai_san_toan_cuc() TO authenticated, service_role;
