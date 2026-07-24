
-- Revoke anon EXECUTE from SECURITY DEFINER functions in public that shouldn't be public.
REVOKE EXECUTE ON FUNCTION public.chan_xoa_bien_ban_da_duyet() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dich_du_lieu_cu(text, integer) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.gen_dac_tinh_ma() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ghi_su_co_atomic(jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.khoa_bien_ban_da_duyet() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rebuild_search_index() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.refresh_mv_tonghop() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_search_index() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_dac_tinh_auto_ma() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_dm_model_sync_loai_thiet_bi() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_gan_chuc_nang_sync_loai_khe() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_thiet_bi_loai_theo_model() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_thiet_bi_require_model() FROM anon, PUBLIC;

-- Ensure authenticated + service_role can still call the RPCs the app uses.
GRANT EXECUTE ON FUNCTION public.ghi_bao_duong_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_hong_hoc_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.ghi_su_co_atomic(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rebuild_search_index() TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_mv_tonghop() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_search_index() TO service_role;
GRANT EXECUTE ON FUNCTION public.dich_du_lieu_cu(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.chan_xoa_bien_ban_da_duyet() TO service_role;
GRANT EXECUTE ON FUNCTION public.khoa_bien_ban_da_duyet() TO service_role;
-- Trigger functions (gen_dac_tinh_ma, tg_*, trg_*) run inside trigger context; no role EXECUTE needed.

-- Materialized views must not be exposed via the Data API.
REVOKE ALL ON public.mv_kpi_bao_tri FROM anon, authenticated;
REVOKE ALL ON public.mv_ton_kho_tong FROM anon, authenticated;
GRANT SELECT ON public.mv_kpi_bao_tri TO service_role;
GRANT SELECT ON public.mv_ton_kho_tong TO service_role;
