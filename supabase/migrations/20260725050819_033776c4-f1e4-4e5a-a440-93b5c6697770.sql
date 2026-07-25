-- Tighten SELECT policy for GPKT storage: require manager rights or matching don_vi via linked license row
DROP POLICY IF EXISTS gpkt_files_read_auth ON storage.objects;

CREATE POLICY gpkt_files_read_scoped ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'giay-phep-khai-thac'
  AND (
    can_manage_equipment(current_uid())
    OR EXISTS (
      SELECT 1
      FROM public.giay_phep_khai_thac g
      WHERE g.file_gpkt = storage.objects.name
        AND (
          get_user_don_vi_ma(current_uid()) IS NULL
          OR g.don_vi = get_user_don_vi_ma(current_uid())
        )
    )
  )
);