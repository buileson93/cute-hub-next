-- 1. app_cai_dat: chỉ cho người đã đăng nhập đọc cấu hình ứng dụng (bỏ quyền đọc ẩn danh)
DROP POLICY IF EXISTS app_cai_dat_read_all ON public.app_cai_dat;
CREATE POLICY app_cai_dat_read_all ON public.app_cai_dat
  FOR SELECT TO authenticated USING (true);

-- 2. thiet_bi_cap_phat: khép phạm vi đọc theo quyền xem thiết bị, chỉ người quản lý thiết bị mới ghi
DROP POLICY IF EXISTS "Đã đăng nhập xem lịch sử cấp phát" ON public.thiet_bi_cap_phat;
CREATE POLICY "Xem lịch sử cấp phát theo phạm vi thiết bị" ON public.thiet_bi_cap_phat
  FOR SELECT TO authenticated
  USING (public.can_view_thiet_bi(thiet_bi_id, auth.uid()));

DROP POLICY IF EXISTS "Đã đăng nhập ghi lịch sử cấp phát" ON public.thiet_bi_cap_phat;
CREATE POLICY "Quản lý thiết bị ghi lịch sử cấp phát" ON public.thiet_bi_cap_phat
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_equipment(auth.uid()));

-- 3. storage bucket model-anh: giữ quyền xem cho người đăng nhập, nhưng chỉ người quản lý thiết bị mới thêm/sửa/xoá ảnh
DROP POLICY IF EXISTS model_anh_insert_authenticated ON storage.objects;
CREATE POLICY model_anh_insert_manager ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'model-anh' AND public.can_manage_equipment(auth.uid()));

DROP POLICY IF EXISTS model_anh_update_authenticated ON storage.objects;
CREATE POLICY model_anh_update_manager ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'model-anh' AND public.can_manage_equipment(auth.uid()))
  WITH CHECK (bucket_id = 'model-anh' AND public.can_manage_equipment(auth.uid()));

DROP POLICY IF EXISTS model_anh_delete_authenticated ON storage.objects;
CREATE POLICY model_anh_delete_manager ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'model-anh' AND public.can_manage_equipment(auth.uid()));