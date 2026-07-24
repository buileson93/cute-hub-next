
CREATE OR REPLACE FUNCTION public.rpc_daily_brief(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_today date := CURRENT_DATE;
BEGIN
  SELECT jsonb_build_object(
    'expiring_gp_7d', (SELECT count(*) FROM public.giay_phep WHERE ngay_het_han BETWEEN v_today AND v_today + INTERVAL '7 days'),
    'expiring_gp_30d', (SELECT count(*) FROM public.giay_phep WHERE ngay_het_han BETWEEN v_today AND v_today + INTERVAL '30 days'),
    'open_incidents', (SELECT count(*) FROM public.su_co WHERE trang_thai IS DISTINCT FROM 'da_dong' AND COALESCE(luu_tru,false)=false),
    'critical_incidents', (SELECT count(*) FROM public.su_co WHERE trang_thai IS DISTINCT FROM 'da_dong' AND muc_do IN ('nghiem_trong','cao') AND COALESCE(luu_tru,false)=false),
    'overdue_pm', (SELECT count(*) FROM public.pm_cong_viec WHERE trang_thai IN ('cho','dang_lam') AND han < v_today),
    'due_pm_7d', (SELECT count(*) FROM public.pm_cong_viec WHERE trang_thai IN ('cho','dang_lam') AND han BETWEEN v_today AND v_today + INTERVAL '7 days'),
    'my_shift_tasks', (SELECT count(*) FROM public.pm_cong_viec WHERE nguoi_phu_trach_id = p_user_id AND trang_thai IN ('cho','dang_lam')),
    'unread_notif', (SELECT count(*) FROM public.notifications WHERE user_id = p_user_id AND read_at IS NULL),
    'generated_at', now()
  ) INTO v_result;
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_daily_brief(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_giay_phep_het_han ON public.giay_phep(ngay_het_han);
CREATE INDEX IF NOT EXISTS idx_su_co_trang_thai ON public.su_co(trang_thai) WHERE COALESCE(luu_tru,false)=false;
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_han_trang_thai ON public.pm_cong_viec(han, trang_thai);
CREATE INDEX IF NOT EXISTS idx_pm_cong_viec_nguoi_phu_trach ON public.pm_cong_viec(nguoi_phu_trach_id, trang_thai);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id) WHERE read_at IS NULL;
