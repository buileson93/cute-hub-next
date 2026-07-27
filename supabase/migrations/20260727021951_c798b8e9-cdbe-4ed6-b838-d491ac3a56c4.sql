
-- 1) SELECT policies siết theo đơn vị / vai trò
DROP POLICY IF EXISTS dbd_han_read ON public.dot_bao_duong_han;
CREATE POLICY dbd_han_read ON public.dot_bao_duong_han FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
);

DROP POLICY IF EXISTS dbd_hm_read ON public.dot_bao_duong_hang_muc;
CREATE POLICY dbd_hm_read ON public.dot_bao_duong_hang_muc FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'phong_kt')
  OR don_vi_id = public.get_user_don_vi_id(auth.uid())
);

-- dot_bao_duong hiện chỉ có policy ALL cho ghi. Thêm SELECT scoped.
DROP POLICY IF EXISTS dbd_read ON public.dot_bao_duong;
CREATE POLICY dbd_read ON public.dot_bao_duong FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'phong_kt')
  OR EXISTS (
    SELECT 1 FROM public.dot_bao_duong_hang_muc h
     WHERE h.dot_id = dot_bao_duong.id
       AND h.don_vi_id = public.get_user_don_vi_id(auth.uid())
  )
);

-- 2) Storage bucket 'dot-bao-duong' — bắt buộc path bắt đầu bằng <hang_muc_id>/
DROP POLICY IF EXISTS dbd_bucket_read ON storage.objects;
DROP POLICY IF EXISTS dbd_bucket_write ON storage.objects;
DROP POLICY IF EXISTS dbd_bucket_update ON storage.objects;
DROP POLICY IF EXISTS dbd_bucket_delete ON storage.objects;

CREATE OR REPLACE FUNCTION public._dbd_object_allowed(_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'phong_kt')
      OR EXISTS (
           SELECT 1
             FROM public.dot_bao_duong_hang_muc h
            WHERE h.id::text = split_part(_name, '/', 1)
              AND h.don_vi_id = public.get_user_don_vi_id(auth.uid())
         );
$$;
REVOKE ALL ON FUNCTION public._dbd_object_allowed(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._dbd_object_allowed(text) TO authenticated;

CREATE POLICY dbd_bucket_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dot-bao-duong' AND public._dbd_object_allowed(name));

CREATE POLICY dbd_bucket_write ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dot-bao-duong' AND public._dbd_object_allowed(name));

CREATE POLICY dbd_bucket_update ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'dot-bao-duong' AND public._dbd_object_allowed(name))
WITH CHECK (bucket_id = 'dot-bao-duong' AND public._dbd_object_allowed(name));

CREATE POLICY dbd_bucket_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'dot-bao-duong' AND public._dbd_object_allowed(name));
