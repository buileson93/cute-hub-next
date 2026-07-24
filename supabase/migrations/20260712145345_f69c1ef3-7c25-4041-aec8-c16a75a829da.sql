-- Harden device visibility: strict unit equality (NULL never matches NULL)
CREATE OR REPLACE FUNCTION public.can_view_thiet_bi(_id uuid, _user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.thiet_bi t
    WHERE t.id = _id
      AND (
        public.can_manage_equipment(_user)
        OR t.don_vi_quan_ly_id = public.get_user_don_vi_id(_user)
        OR t.don_vi_id = public.get_user_don_vi_id(_user)
      )
  )
$function$;

ALTER POLICY thiet_bi_read_scope ON public.thiet_bi
  USING (
    is_active_user(auth.uid())
    AND (
      can_manage_equipment(auth.uid())
      OR don_vi_quan_ly_id = get_user_don_vi_id(auth.uid())
      OR don_vi_id = get_user_don_vi_id(auth.uid())
    )
  );