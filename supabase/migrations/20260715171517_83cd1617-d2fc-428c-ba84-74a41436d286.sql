GRANT EXECUTE ON FUNCTION public.get_user_don_vi_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.can_manage_equipment(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.can_view_thiet_bi(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;