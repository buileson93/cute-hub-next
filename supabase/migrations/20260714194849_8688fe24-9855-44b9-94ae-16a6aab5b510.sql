-- Task 33 — RLS hoàn thiện: bổ sung WITH CHECK tường minh cho 6 UPDATE policy
-- Postgres mặc định lặp lại USING khi WITH CHECK NULL, nhưng khai báo tường minh
-- giúp chặn "update-and-move-row" (đổi khoá ngoại/owner sang phạm vi khác) rõ ràng
-- và tránh hồi quy khi ai đó chỉnh sửa policy sau này.

-- 1) backup_lich_su
DROP POLICY IF EXISTS "Admin sửa lịch sử backup" ON public.backup_lich_su;
CREATE POLICY "Admin sửa lịch sử backup"
  ON public.backup_lich_su FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) conversation_participant
DROP POLICY IF EXISTS cp_update_own ON public.conversation_participant;
CREATE POLICY cp_update_own
  ON public.conversation_participant FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) conversations
DROP POLICY IF EXISTS conv_update_creator ON public.conversations;
CREATE POLICY conv_update_creator
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR is_conv_participant(id, auth.uid()))
  WITH CHECK (created_by = auth.uid() OR is_conv_participant(id, auth.uid()));

-- 4) notifications
DROP POLICY IF EXISTS notif_update_own ON public.notifications;
CREATE POLICY notif_update_own
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5) tickets
DROP POLICY IF EXISTS tickets_update_own_or_admin ON public.tickets;
CREATE POLICY tickets_update_own_or_admin
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- 6) vi_tri_media
DROP POLICY IF EXISTS vi_tri_media_update ON public.vi_tri_media;
CREATE POLICY vi_tri_media_update
  ON public.vi_tri_media FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR can_manage_equipment(auth.uid()))
  WITH CHECK (created_by = auth.uid() OR can_manage_equipment(auth.uid()));