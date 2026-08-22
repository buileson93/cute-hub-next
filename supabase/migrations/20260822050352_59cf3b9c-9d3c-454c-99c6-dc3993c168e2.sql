REVOKE EXECUTE ON FUNCTION public.update_user_full(uuid, text, text, app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_full(uuid, text, text, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_full(uuid, text, text, app_role[]) TO service_role;
