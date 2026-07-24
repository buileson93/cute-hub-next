DROP POLICY IF EXISTS conv_select_participant ON public.conversations;

CREATE POLICY conv_select_participant ON public.conversations
FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_conv_participant(id, auth.uid()));