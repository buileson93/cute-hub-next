
-- Default setting
INSERT INTO public.app_cai_dat(khoa, gia_tri)
VALUES ('audit_retention_days', '365')
ON CONFLICT (khoa) DO NOTHING;

-- Reader (admin-only)
CREATE OR REPLACE FUNCTION public.admin_get_audit_retention()
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_days integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT NULLIF(gia_tri, '')::int INTO v_days FROM public.app_cai_dat WHERE khoa = 'audit_retention_days';
  RETURN COALESCE(v_days, 365);
END;
$$;

-- Writer (admin-only)
CREATE OR REPLACE FUNCTION public.admin_set_audit_retention(_days integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _days IS NULL OR _days < 30 OR _days > 3650 THEN
    RAISE EXCEPTION 'audit_retention_days phải trong khoảng 30..3650';
  END IF;
  INSERT INTO public.app_cai_dat(khoa, gia_tri, updated_by, updated_at)
  VALUES ('audit_retention_days', _days::text, auth.uid(), now())
  ON CONFLICT (khoa) DO UPDATE SET gia_tri = EXCLUDED.gia_tri, updated_by = EXCLUDED.updated_by, updated_at = now();
  RETURN _days;
END;
$$;

-- Cleanup function (runs as owner, callable by cron)
CREATE OR REPLACE FUNCTION public.run_audit_retention()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_days integer; v_deleted integer;
BEGIN
  SELECT COALESCE(NULLIF(gia_tri, '')::int, 365) INTO v_days
  FROM public.app_cai_dat WHERE khoa = 'audit_retention_days';
  IF v_days IS NULL THEN v_days := 365; END IF;

  WITH d AS (
    DELETE FROM public.audit_log
    WHERE created_at < now() - (v_days || ' days')::interval
    RETURNING 1
  )
  SELECT count(*) INTO v_deleted FROM d;

  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_audit_retention() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_audit_retention(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.run_audit_retention() FROM PUBLIC;

-- Schedule daily cleanup at 03:15
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'audit_retention_cleanup';
    PERFORM cron.schedule('audit_retention_cleanup', '15 3 * * *', $c$SELECT public.run_audit_retention();$c$);
  END IF;
END $$;
