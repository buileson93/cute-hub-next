-- 1. Thiết lập REPLICA IDENTITY FULL cho các bảng nghiệp vụ thiếu
ALTER TABLE public.su_co REPLICA IDENTITY FULL;
ALTER TABLE public.bao_tri REPLICA IDENTITY FULL;
ALTER TABLE public.hong_hoc REPLICA IDENTITY FULL;
ALTER TABLE public.van_de REPLICA IDENTITY FULL;
ALTER TABLE public.ban_giao REPLICA IDENTITY FULL;
ALTER TABLE public.access_request REPLICA IDENTITY FULL;
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- 2. Cấu hình Publication cho Realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Thêm các bảng vào publication
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.su_co, 
    public.bao_tri, 
    public.hong_hoc, 
    public.van_de, 
    public.ban_giao, 
    public.thiet_bi, 
    public.he_thong_thanh_phan, 
    public.gan_chuc_nang, 
    public.access_request, 
    public.user_roles,
    public.messages,
    public.notifications,
    public.conversations;

-- 3. Cơ chế Refresh Dashboard Materialized View
CREATE OR REPLACE FUNCTION public.refresh_dashboard_overview()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_overview;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW public.mv_dashboard_overview;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_dashboard_overview() TO authenticated;

-- 4. Thiết lập Cron Job (nếu extension pg_cron khả dụng)
DO $$
BEGIN
    PERFORM cron.schedule(
        'refresh-dashboard-5m',
        '*/5 * * * *',
        'SELECT public.refresh_dashboard_overview()'
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Extension pg_cron not available, skipping cron schedule.';
END $$;
