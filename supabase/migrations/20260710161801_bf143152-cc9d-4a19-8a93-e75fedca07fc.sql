-- RLS policies for the model-anh bucket (device model images)
CREATE POLICY "model_anh_read_authenticated"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'model-anh');

CREATE POLICY "model_anh_insert_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'model-anh');

CREATE POLICY "model_anh_update_authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'model-anh')
WITH CHECK (bucket_id = 'model-anh');

CREATE POLICY "model_anh_delete_authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'model-anh');