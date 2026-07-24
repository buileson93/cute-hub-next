DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['he_thong_thanh_phan','gan_chuc_nang','dm_he_thong','thiet_bi','cay_node_edit','dm_nhom_he_thong','dm_vi_tri','dm_don_vi']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
  END LOOP;
END $$;