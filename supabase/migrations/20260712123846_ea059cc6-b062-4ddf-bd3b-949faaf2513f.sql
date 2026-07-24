REVOKE EXECUTE ON FUNCTION public.kho_ton_hien_tai(uuid, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.kho_nhap(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.kho_xuat(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid, boolean) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.kho_chuyen(uuid, uuid, uuid, numeric, text, boolean) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.kho_kiem_ke(uuid, uuid, numeric, text) FROM public, anon;
REVOKE EXECUTE ON FUNCTION public.trg_kgd_before_ins() FROM public, anon;