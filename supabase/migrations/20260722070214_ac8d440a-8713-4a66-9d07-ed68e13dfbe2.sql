
-- MV giữ đúng shape JSON mà rpc_dashboard_overview đang trả.
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_overview AS
SELECT
  jsonb_build_object(
    'thiet_bi_total', (SELECT count(*) FROM public.thiet_bi),
    'thiet_bi_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai_id::text,'null'), c)
      FROM (SELECT trang_thai_id, count(*) c FROM public.thiet_bi GROUP BY trang_thai_id) s
    ), '{}'::jsonb),
    'su_co_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.su_co GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'bao_tri_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.bao_tri GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'hong_hoc_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.hong_hoc GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'refreshed_at', now()
  ) AS payload;

GRANT SELECT ON public.mv_dashboard_overview TO authenticated;
GRANT SELECT ON public.mv_dashboard_overview TO service_role;

-- Cho phép REFRESH CONCURRENTLY sau này (cần unique index).
CREATE UNIQUE INDEX IF NOT EXISTS mv_dashboard_overview_uniq
  ON public.mv_dashboard_overview ((payload->>'refreshed_at'));

-- Refresh lần đầu để có dữ liệu ngay.
REFRESH MATERIALIZED VIEW public.mv_dashboard_overview;

-- rpc_dashboard_overview đọc từ MV; nếu rỗng fallback tính trực tiếp.
CREATE OR REPLACE FUNCTION public.rpc_dashboard_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v jsonb;
BEGIN
  SELECT payload INTO v FROM public.mv_dashboard_overview LIMIT 1;
  IF v IS NOT NULL THEN
    RETURN v;
  END IF;
  RETURN jsonb_build_object(
    'thiet_bi_total', (SELECT count(*) FROM public.thiet_bi),
    'thiet_bi_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai_id::text,'null'), c)
      FROM (SELECT trang_thai_id, count(*) c FROM public.thiet_bi GROUP BY trang_thai_id) s
    ), '{}'::jsonb),
    'su_co_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.su_co GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'bao_tri_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.bao_tri GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'hong_hoc_by_trang_thai', COALESCE((
      SELECT jsonb_object_agg(COALESCE(trang_thai::text,'null'), c)
      FROM (SELECT trang_thai, count(*) c FROM public.hong_hoc GROUP BY trang_thai) s
    ), '{}'::jsonb),
    'refreshed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_dashboard_overview() TO authenticated;

-- Đăng ký cron 5 phút/lần refresh MV.
DO $$
BEGIN
  PERFORM cron.unschedule('mv_dashboard_overview_refresh')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mv_dashboard_overview_refresh');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'mv_dashboard_overview_refresh',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW public.mv_dashboard_overview$$
);
