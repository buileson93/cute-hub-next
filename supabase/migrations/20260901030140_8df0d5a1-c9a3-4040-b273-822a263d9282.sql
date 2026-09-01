REVOKE ALL ON public.mv_dashboard_overview FROM anon, authenticated;
REVOKE ALL ON public.mv_asset_anomaly FROM anon, authenticated;
GRANT SELECT ON public.mv_dashboard_overview TO service_role;
GRANT SELECT ON public.mv_asset_anomaly TO service_role;