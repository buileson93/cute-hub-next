-- 1. Create audit_log table if not exists (standardized)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id),
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text,
    detail text,
    metadata jsonb
);

GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs" ON public.audit_log
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'));

CREATE POLICY "System can insert logs" ON public.audit_log
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 2. Create phan_mem_ban_quyen_tep table
CREATE TABLE IF NOT EXISTS public.phan_mem_ban_quyen_tep (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    ban_quyen_id uuid REFERENCES public.phan_mem_ban_quyen(id) ON DELETE CASCADE,
    ten_tep text NOT NULL,
    loai_tep text,
    url text NOT NULL,
    size_bytes bigint,
    uploaded_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.phan_mem_ban_quyen_tep TO authenticated;
GRANT ALL ON public.phan_mem_ban_quyen_tep TO service_role;

ALTER TABLE public.phan_mem_ban_quyen_tep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone authenticated can view files" ON public.phan_mem_ban_quyen_tep
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can manage files" ON public.phan_mem_ban_quyen_tep
    FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt'));

-- 3. RPC for License Summary (KPIs)
CREATE OR REPLACE FUNCTION public.ban_quyen_tong_hop(p_don_vi_ids uuid[] DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'valid', COUNT(*) FILTER (WHERE ngay_het_han IS NULL OR ngay_het_han > CURRENT_DATE),
        'expiring', COUNT(*) FILTER (WHERE ngay_het_han IS NOT NULL AND ngay_het_han BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '60 days')),
        'expired', COUNT(*) FILTER (WHERE ngay_het_han IS NOT NULL AND ngay_het_han <= CURRENT_DATE),
        'chiPhi', COALESCE(SUM(gia_tri), 0),
        'ghe', COALESCE(SUM(so_ghe), 0),
        'gheDung', (SELECT COUNT(*) FROM public.phan_mem_ban_quyen_cap_phat cp 
                    JOIN public.phan_mem_ban_quyen bq ON cp.ban_quyen_id = bq.id
                    WHERE cp.ngay_thu_hoi IS NULL 
                    AND (p_don_vi_ids IS NULL OR bq.don_vi_id = ANY(p_don_vi_ids)))
    ) INTO result
    FROM public.phan_mem_ban_quyen
    WHERE (p_don_vi_ids IS NULL OR don_vi_id = ANY(p_don_vi_ids));
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ban_quyen_tong_hop(uuid[]) TO authenticated;
