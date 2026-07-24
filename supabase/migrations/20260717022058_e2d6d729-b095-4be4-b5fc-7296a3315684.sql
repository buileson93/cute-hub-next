
-- Task: siết storage policies theo scan finding
-- 1) Chuẩn hoá dùng auth.uid() (thay vì mixing auth.uid()/current_uid())
-- 2) chat-files: bắt buộc path[1] = auth.uid() và user là thành viên ít nhất 1 conversation
-- 3) Buckets tham chiếu shared: bổ sung guard auth.uid() IS NOT NULL để rõ intent

-- ========== avatars ==========
DROP POLICY IF EXISTS "auth_ins_avatars" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_avatars" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_avatars" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_avatars" ON storage.objects;

CREATE POLICY "auth_read_avatars" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
CREATE POLICY "auth_upd_avatars" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'avatars' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_avatars" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== chu-ky ==========
DROP POLICY IF EXISTS "auth_ins_chu-ky" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_chu-ky" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_chu-ky" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_chu-ky" ON storage.objects;

CREATE POLICY "auth_read_chu-ky" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chu-ky' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_ins_chu-ky" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chu-ky' AND owner = auth.uid());
CREATE POLICY "auth_upd_chu-ky" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chu-ky' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'chu-ky' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_chu-ky" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chu-ky' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== chat-files ==========
-- Path convention: `{auth.uid()}/{uuid}-{filename}` → bắt buộc segment[1] = auth.uid()
-- Uploader phải là participant của ít nhất 1 conversation
DROP POLICY IF EXISTS "auth_ins_chat-files" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_chat-files" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_chat-files" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_chat-files" ON storage.objects;

CREATE POLICY "auth_ins_chat-files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-files'
    AND owner = auth.uid()
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.conversation_participant cp
      WHERE cp.user_id = auth.uid()
    )
  );
CREATE POLICY "auth_read_chat-files" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND (
      owner = auth.uid()
      OR public.can_manage_equipment(auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.conversation_participant cp ON cp.conversation_id = m.conversation_id
        WHERE m.file_path = storage.objects.name
          AND cp.user_id = auth.uid()
      )
    )
  );
CREATE POLICY "auth_upd_chat-files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-files' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'chat-files' AND owner = auth.uid());
CREATE POLICY "auth_del_chat-files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-files' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== model-anh (shared read cho user đã đăng nhập) ==========
DROP POLICY IF EXISTS "auth_ins_model-anh" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_model-anh" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_model-anh" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_model-anh" ON storage.objects;

CREATE POLICY "auth_read_model-anh" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'model-anh' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_model-anh" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-anh' AND owner = auth.uid() AND public.can_manage_equipment(auth.uid()));
CREATE POLICY "auth_upd_model-anh" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'model-anh' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'model-anh' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_model-anh" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'model-anh' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== model-tai-lieu ==========
DROP POLICY IF EXISTS "auth_ins_model-tai-lieu" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_model-tai-lieu" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_model-tai-lieu" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_model-tai-lieu" ON storage.objects;

CREATE POLICY "auth_read_model-tai-lieu" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'model-tai-lieu' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_model-tai-lieu" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-tai-lieu' AND owner = auth.uid() AND public.can_manage_equipment(auth.uid()));
CREATE POLICY "auth_upd_model-tai-lieu" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'model-tai-lieu' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'model-tai-lieu' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_model-tai-lieu" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'model-tai-lieu' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== nha-san-xuat-logo ==========
DROP POLICY IF EXISTS "auth_ins_nha-san-xuat-logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_nha-san-xuat-logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_nha-san-xuat-logo" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_nha-san-xuat-logo" ON storage.objects;

CREATE POLICY "auth_read_nha-san-xuat-logo" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_nha-san-xuat-logo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nha-san-xuat-logo' AND owner = auth.uid() AND public.can_manage_equipment(auth.uid()));
CREATE POLICY "auth_upd_nha-san-xuat-logo" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'nha-san-xuat-logo' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_nha-san-xuat-logo" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== so-do-tep ==========
DROP POLICY IF EXISTS "auth_ins_so-do-tep" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_so-do-tep" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_so-do-tep" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_so-do-tep" ON storage.objects;

CREATE POLICY "auth_read_so-do-tep" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'so-do-tep' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_so-do-tep" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'so-do-tep' AND owner = auth.uid());
CREATE POLICY "auth_upd_so-do-tep" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'so-do-tep' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'so-do-tep' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_so-do-tep" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'so-do-tep' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== so-do-thu-vien ==========
DROP POLICY IF EXISTS "auth_ins_so-do-thu-vien" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_so-do-thu-vien" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_so-do-thu-vien" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_so-do-thu-vien" ON storage.objects;

CREATE POLICY "auth_read_so-do-thu-vien" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'so-do-thu-vien' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_so-do-thu-vien" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'so-do-thu-vien' AND owner = auth.uid());
CREATE POLICY "auth_upd_so-do-thu-vien" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'so-do-thu-vien' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'so-do-thu-vien' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_so-do-thu-vien" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'so-do-thu-vien' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));

-- ========== vi-tri-media ==========
DROP POLICY IF EXISTS "auth_ins_vi-tri-media" ON storage.objects;
DROP POLICY IF EXISTS "auth_upd_vi-tri-media" ON storage.objects;
DROP POLICY IF EXISTS "auth_del_vi-tri-media" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_vi-tri-media" ON storage.objects;

CREATE POLICY "auth_read_vi-tri-media" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vi-tri-media' AND auth.uid() IS NOT NULL);
CREATE POLICY "auth_ins_vi-tri-media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vi-tri-media' AND owner = auth.uid());
CREATE POLICY "auth_upd_vi-tri-media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'vi-tri-media' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())))
  WITH CHECK (bucket_id = 'vi-tri-media' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
CREATE POLICY "auth_del_vi-tri-media" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vi-tri-media' AND (owner = auth.uid() OR public.can_manage_equipment(auth.uid())));
