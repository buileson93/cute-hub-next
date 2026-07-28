
-- 1. dot_bao_duong: remove overly permissive read policy
DROP POLICY IF EXISTS dot_bd_read ON public.dot_bao_duong;

-- 2. dot_bao_duong_audit_log: restrict INSERT
DROP POLICY IF EXISTS dbd_audit_insert ON public.dot_bao_duong_audit_log;
CREATE POLICY dbd_audit_insert ON public.dot_bao_duong_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    actor = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.dot_bao_duong_hang_muc h
      WHERE h.id = hang_muc_id AND h.dot_id = dot_id
    )
  );

-- 3. thong_bao_cau_hinh: scope read policy
DROP POLICY IF EXISTS thong_bao_cau_hinh_read ON public.thong_bao_cau_hinh;
CREATE POLICY thong_bao_cau_hinh_read ON public.thong_bao_cau_hinh
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'phong_kt'::app_role)
    OR don_vi_id = get_user_don_vi_id(auth.uid())
    OR don_vi_id IS NULL
  );
