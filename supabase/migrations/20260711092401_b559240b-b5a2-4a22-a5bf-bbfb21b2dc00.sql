-- Fix 1: Function Search Path Mutable — pin search_path on project function.
ALTER FUNCTION public.thoi_gian_may_chu() SET search_path = public;

-- Fix 2: Public Can Execute SECURITY DEFINER Function
-- Revoke EXECUTE from anonymous/public on SECURITY DEFINER routines so they
-- can only run for signed-in users (trigger functions still fire on their own).
REVOKE EXECUTE ON FUNCTION public.ghi_kiem_ke(uuid, text, text, text, text, text, timestamptz, integer) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.ghi_kiem_ke(uuid, text, text, text, text, text, timestamptz, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.he_thong_truong_don_gia_tri(text) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.he_thong_truong_don_gia_tri(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.thiet_bi_set_thuoc_tinh(uuid, jsonb) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.thiet_bi_set_thuoc_tinh(uuid, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.thiet_bi_truong_ap_dung(uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.thiet_bi_truong_ap_dung(uuid) TO authenticated, service_role;

-- Trigger functions: remove direct callability by anyone; triggers still run.
REVOKE EXECUTE ON FUNCTION public.log_thiet_bi_vong_doi() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_thuoc_tinh() FROM anon, PUBLIC;