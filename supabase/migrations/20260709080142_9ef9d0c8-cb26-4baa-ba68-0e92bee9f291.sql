-- 1) Fix mutable search_path on internal validation helpers
ALTER FUNCTION public._admin_check_ident(text) SET search_path = public;
ALTER FUNCTION public._admin_check_type(text) SET search_path = public;

-- 2) Revoke execute on sensitive SECURITY DEFINER functions from anon/public.
--    These are only ever called by signed-in admins (client RPCs) or internally
--    by other definer functions, so authenticated execute is preserved.
REVOKE EXECUTE ON FUNCTION public.admin_add_column(text, text, text, boolean, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_drop_column(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_rename_column(text, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_list_schema() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.admin_rollback_audit(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_app_event(text, text, text, jsonb) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public._admin_check_table(text) FROM anon, public;