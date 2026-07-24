
SET ROLE sandbox_exec;

DROP POLICY IF EXISTS form_sub_tb_select_by_parent ON public.form_submission_thiet_bi;
CREATE POLICY form_sub_tb_select_by_parent
ON public.form_submission_thiet_bi
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.form_submission s
    WHERE s.id = form_submission_thiet_bi.submission_id
      AND public.is_active_user(public.current_uid())
      AND (
        public.can_manage_equipment(public.current_uid())
        OR s.created_by = public.current_uid()
        OR (
          s.status <> 'draft'::public.form_submission_status
          AND s.don_vi_id IS NOT NULL
          AND s.don_vi_id = public.get_user_don_vi_id(public.current_uid())
        )
      )
  )
);

DROP POLICY IF EXISTS htp_select ON public.he_thong_thanh_phan;
CREATE POLICY htp_select
ON public.he_thong_thanh_phan
FOR SELECT
USING (
  public.is_active_user(public.current_uid())
  AND (
    public.can_manage_equipment(public.current_uid())
    OR (
      don_vi_id_snapshot IS NOT NULL
      AND don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid())
    )
  )
);
ALTER TABLE public.he_thong_thanh_phan
  ALTER COLUMN don_vi_id_snapshot SET NOT NULL;

RESET ROLE;

DROP POLICY IF EXISTS "auth_ins_chat-files" ON storage.objects;
CREATE POLICY "auth_ins_chat-files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-files'
  AND owner = auth.uid()
  AND (storage.foldername(name))[1] = (auth.uid())::text
  AND (storage.foldername(name))[2] IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.conversation_participant cp
    WHERE cp.user_id = auth.uid()
      AND cp.conversation_id::text = (storage.foldername(name))[2]
  )
);
