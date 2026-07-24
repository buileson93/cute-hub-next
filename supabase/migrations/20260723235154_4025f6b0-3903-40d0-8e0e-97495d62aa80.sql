GRANT SELECT, REFERENCES ON public.dm_he_thong TO authenticator;
GRANT SELECT, REFERENCES ON public.he_thong_thanh_phan TO authenticator;
GRANT SELECT, REFERENCES ON public.dm_loai_thiet_bi TO authenticator;
GRANT SELECT, REFERENCES ON public.dm_trang_thai_thiet_bi TO authenticator;
GRANT SELECT, REFERENCES ON public.dm_vi_tri TO authenticator;

NOTIFY pgrst, 'reload schema';