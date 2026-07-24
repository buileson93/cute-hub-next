
-- INDEX
CREATE INDEX IF NOT EXISTS idx_thiet_bi_trang_thai ON public.thiet_bi(trang_thai_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_don_vi ON public.thiet_bi(don_vi_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_he_thong ON public.thiet_bi(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_loai ON public.thiet_bi(loai_thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_nsx ON public.thiet_bi(nha_san_xuat_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_created ON public.thiet_bi(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_ma ON public.thiet_bi(ma_thiet_bi);

CREATE INDEX IF NOT EXISTS idx_gcn_thiet_bi_active
  ON public.gan_chuc_nang(thiet_bi_id) WHERE den_ngay IS NULL;
CREATE INDEX IF NOT EXISTS idx_gcn_thanh_phan_active
  ON public.gan_chuc_nang(thanh_phan_id) WHERE den_ngay IS NULL;

CREATE INDEX IF NOT EXISTS idx_htp_he_thong ON public.he_thong_thanh_phan(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_htp_parent ON public.he_thong_thanh_phan(thanh_phan_cha);

CREATE INDEX IF NOT EXISTS idx_su_co_ngay ON public.su_co(ngay_phat_hien DESC);
CREATE INDEX IF NOT EXISTS idx_su_co_trang_thai ON public.su_co(trang_thai);
CREATE INDEX IF NOT EXISTS idx_bao_tri_ngay ON public.bao_tri(ngay_bat_dau DESC);
CREATE INDEX IF NOT EXISTS idx_bao_tri_trang_thai ON public.bao_tri(trang_thai);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_ngay ON public.hong_hoc(ngay_hong DESC);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_trang_thai ON public.hong_hoc(trang_thai);
CREATE INDEX IF NOT EXISTS idx_ban_giao_ngay ON public.ban_giao(ngay_nhan DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON public.audit_log(user_id, created_at DESC);

-- FULL-TEXT SEARCH cho thiet_bi
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      coalesce(ma_thiet_bi,'') || ' ' ||
      coalesce(ten_thiet_bi,'') || ' ' ||
      coalesce(ma_serial,'') || ' ' ||
      coalesce(model,'')
    )
  ) STORED;
CREATE INDEX IF NOT EXISTS idx_thiet_bi_search_tsv ON public.thiet_bi USING GIN(search_tsv);

-- RPC & VIEW AGGREGATE
CREATE OR REPLACE FUNCTION public.rpc_count_thiet_bi_by_trang_thai()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.thiet_bi),
    'by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai_id::text, 'chua_gan'), n)
       FROM (
         SELECT trang_thai_id, count(*) AS n
         FROM public.thiet_bi
         GROUP BY trang_thai_id
       ) t),
      '{}'::jsonb
    )
  );
$$;
GRANT EXECUTE ON FUNCTION public.rpc_count_thiet_bi_by_trang_thai() TO authenticated;

CREATE OR REPLACE VIEW public.v_nsx_stats AS
SELECT
  n.id AS nha_san_xuat_id,
  n.ma,
  n.ten,
  coalesce(m.n_model, 0) AS so_model,
  coalesce(t.n_thiet_bi, 0) AS so_thiet_bi
FROM public.dm_nha_san_xuat n
LEFT JOIN (
  SELECT nha_san_xuat_id, count(*)::int AS n_model
  FROM public.dm_model
  WHERE nha_san_xuat_id IS NOT NULL
  GROUP BY nha_san_xuat_id
) m ON m.nha_san_xuat_id = n.id
LEFT JOIN (
  SELECT nha_san_xuat_id, count(*)::int AS n_thiet_bi
  FROM public.thiet_bi
  WHERE nha_san_xuat_id IS NOT NULL
  GROUP BY nha_san_xuat_id
) t ON t.nha_san_xuat_id = n.id;
GRANT SELECT ON public.v_nsx_stats TO authenticated;

CREATE OR REPLACE FUNCTION public.rpc_dashboard_overview()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'thiet_bi_total', (SELECT count(*) FROM public.thiet_bi),
    'thiet_bi_by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai_id::text,'chua_gan'), n)
       FROM (SELECT trang_thai_id, count(*) n FROM public.thiet_bi GROUP BY trang_thai_id) x), '{}'::jsonb),
    'su_co_by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai,'unknown'), n)
       FROM (SELECT trang_thai, count(*) n FROM public.su_co GROUP BY trang_thai) x), '{}'::jsonb),
    'bao_tri_by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai,'unknown'), n)
       FROM (SELECT trang_thai, count(*) n FROM public.bao_tri GROUP BY trang_thai) x), '{}'::jsonb),
    'hong_hoc_by_trang_thai', coalesce(
      (SELECT jsonb_object_agg(coalesce(trang_thai,'unknown'), n)
       FROM (SELECT trang_thai, count(*) n FROM public.hong_hoc GROUP BY trang_thai) x), '{}'::jsonb)
  );
$$;
GRANT EXECUTE ON FUNCTION public.rpc_dashboard_overview() TO authenticated;

CREATE OR REPLACE VIEW public.v_menu_badges AS
SELECT
  (SELECT count(*) FROM public.su_co
     WHERE trang_thai IS NOT NULL AND trang_thai NOT IN ('DA_XU_LY','DA_DONG','HOAN_THANH','CLOSED','DONE'))::int AS su_co_mo,
  (SELECT count(*) FROM public.bao_tri
     WHERE trang_thai IS NOT NULL AND trang_thai NOT IN ('HOAN_THANH','DA_DONG','CLOSED','DONE'))::int AS bao_tri_mo,
  (SELECT count(*) FROM public.hong_hoc
     WHERE trang_thai IS NOT NULL AND trang_thai NOT IN ('HOAN_THANH','DA_XU_LY','DA_DONG','CLOSED','DONE'))::int AS hong_hoc_mo,
  (SELECT count(*) FROM public.bao_tri WHERE ngay_bat_dau = current_date)::int AS bao_tri_hom_nay;
GRANT SELECT ON public.v_menu_badges TO authenticated;
