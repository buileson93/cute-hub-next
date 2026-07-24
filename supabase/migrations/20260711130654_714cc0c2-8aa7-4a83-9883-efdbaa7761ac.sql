-- Cột logo cho nhà sản xuất (đường dẫn ảnh trong storage)
ALTER TABLE public.dm_nha_san_xuat ADD COLUMN IF NOT EXISTS logo TEXT;

-- RLS cho bucket logo nhà sản xuất: ai đăng nhập cũng xem/tải/sửa/xoá được
CREATE POLICY "nsx_logo_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo');

CREATE POLICY "nsx_logo_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'nha-san-xuat-logo');

CREATE POLICY "nsx_logo_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo');

CREATE POLICY "nsx_logo_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'nha-san-xuat-logo');