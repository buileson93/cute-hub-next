
-- Helper: get the dm_don_vi.id for a user (via profiles.don_vi enum -> dm_don_vi.ma)
CREATE OR REPLACE FUNCTION public.get_user_don_vi_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dv.id
  FROM public.profiles p
  JOIN public.dm_don_vi dv ON dv.ma = (p.don_vi)::text
  WHERE p.id = _user_id
  LIMIT 1
$$;

-- thiet_bi: unit accounts only see equipment of their own unit; managers see all
DROP POLICY IF EXISTS thiet_bi_read_active ON public.thiet_bi;
CREATE POLICY thiet_bi_read_scope ON public.thiet_bi
FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(auth.uid())
  )
);

-- giay_phep: scope by underlying thiet_bi's unit
DROP POLICY IF EXISTS giay_phep_read_active ON public.giay_phep;
CREATE POLICY giay_phep_read_scope ON public.giay_phep
FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.thiet_bi tb
      WHERE tb.id = giay_phep.thiet_bi_id
        AND tb.don_vi_quan_ly_id IS NOT DISTINCT FROM public.get_user_don_vi_id(auth.uid())
    )
  )
);

-- form_submission: tighten so unit users only see submissions of their unit (any status of their own; non-draft of unit)
DROP POLICY IF EXISTS form_submission_select_scope ON public.form_submission;
CREATE POLICY form_submission_select_scope ON public.form_submission
FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR created_by = auth.uid()
    OR (
      status <> 'draft'::form_submission_status
      AND don_vi_id IS NOT NULL
      AND don_vi_id = public.get_user_don_vi_id(auth.uid())
    )
  )
);
