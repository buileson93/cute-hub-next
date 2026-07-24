
-- Materialized view: số sự cố 90 ngày / tài sản + z-score theo cùng loại thiết bị
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_asset_anomaly AS
WITH per_asset AS (
  SELECT thiet_bi_id, count(*)::int AS c
  FROM public.su_co
  WHERE thiet_bi_id IS NOT NULL
    AND ngay_phat_hien >= now() - interval '90 days'
  GROUP BY thiet_bi_id
),
per_type AS (
  SELECT tb.loai_thiet_bi_id,
         avg(pa.c)::numeric AS mean_c,
         COALESCE(stddev_samp(pa.c), 0)::numeric AS sd_c
  FROM per_asset pa
  JOIN public.thiet_bi tb ON tb.id = pa.thiet_bi_id
  GROUP BY tb.loai_thiet_bi_id
)
SELECT
  tb.id AS asset_id,
  COALESCE(pa.c, 0)::int AS incident_count_90d,
  CASE
    WHEN pt.sd_c IS NULL OR pt.sd_c = 0 THEN 0::numeric
    ELSE round(((COALESCE(pa.c,0) - pt.mean_c) / pt.sd_c)::numeric, 2)
  END AS z_score
FROM public.thiet_bi tb
LEFT JOIN per_asset pa ON pa.thiet_bi_id = tb.id
LEFT JOIN per_type pt ON pt.loai_thiet_bi_id = tb.loai_thiet_bi_id;

CREATE UNIQUE INDEX IF NOT EXISTS mv_asset_anomaly_asset_id_idx
  ON public.mv_asset_anomaly(asset_id);
CREATE INDEX IF NOT EXISTS mv_asset_anomaly_z_idx
  ON public.mv_asset_anomaly(z_score);

GRANT SELECT ON public.mv_asset_anomaly TO authenticated, service_role;

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_mv_asset_anomaly()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_asset_anomaly;
$$;
GRANT EXECUTE ON FUNCTION public.refresh_mv_asset_anomaly() TO service_role, authenticated;

-- pg_cron: refresh 6h/lần
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'refresh_mv_asset_anomaly') THEN
    PERFORM cron.schedule(
      'refresh_mv_asset_anomaly',
      '0 */6 * * *',
      $c$SELECT public.refresh_mv_asset_anomaly();$c$
    );
  END IF;
END $$;

-- Refresh lần đầu (không CONCURRENTLY vì MV vừa tạo trống)
REFRESH MATERIALIZED VIEW public.mv_asset_anomaly;

-- Cập nhật rpc_tai_san_toan_cuc: kèm anomalyScore + soSuCo90n
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
      'ngayBaoTriKeTiep', to_char(tb.ngay_bao_tri_ke_tiep, 'DD/MM/YYYY'),
      'soSuCo90n', COALESCE(an.incident_count_90d, 0),
      'anomalyScore', COALESCE(an.z_score, 0)
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
    LEFT JOIN public.mv_asset_anomaly an ON an.asset_id = tb.id
    ORDER BY tb.ma_thiet_bi
  )
  SELECT COALESCE(jsonb_agg(r), '[]'::jsonb) FROM rows;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_tai_san_toan_cuc() TO authenticated, service_role;
