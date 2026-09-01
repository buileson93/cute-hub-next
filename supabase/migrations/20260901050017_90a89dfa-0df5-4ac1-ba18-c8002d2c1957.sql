DROP POLICY IF EXISTS "Users can view events for projects they have access to" ON public.du_an_su_kien;

CREATE POLICY "Users can view events for projects they have access to"
ON public.du_an_su_kien
FOR SELECT
TO authenticated
USING (public.can_access_du_an(du_an_id, auth.uid()));