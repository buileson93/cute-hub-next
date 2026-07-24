GRANT SELECT, INSERT, UPDATE, DELETE ON public.he_thong_thanh_phan TO authenticated;
GRANT ALL ON public.he_thong_thanh_phan TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_he_thong TO authenticated;
GRANT ALL ON public.dm_he_thong TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_don_vi TO authenticated;
GRANT ALL ON public.dm_don_vi TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_vi_tri TO authenticated;
GRANT ALL ON public.dm_vi_tri TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gan_chuc_nang TO authenticated;
GRANT ALL ON public.gan_chuc_nang TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi TO authenticated;
GRANT ALL ON public.thiet_bi TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cay_node_edit TO authenticated;
GRANT ALL ON public.cay_node_edit TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cay_thay_doi TO authenticated;
GRANT ALL ON public.cay_thay_doi TO service_role;

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT ON public.role_permission TO authenticated;
GRANT ALL ON public.role_permission TO service_role;