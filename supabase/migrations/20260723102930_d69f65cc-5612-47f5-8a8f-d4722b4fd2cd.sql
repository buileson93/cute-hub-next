DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
                 WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='form_submission_signature') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.form_submission_signature';
  END IF;
END $$;
ALTER TABLE public.form_submission_signature REPLICA IDENTITY FULL;
ALTER TABLE public.form_submission REPLICA IDENTITY FULL;