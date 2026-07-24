-- ============ Bảng lưu trữ (cấu trúc giống bảng gốc, không PK/constraint) ============
CREATE TABLE IF NOT EXISTS public.kho_giao_dich_archive (LIKE public.kho_giao_dich INCLUDING DEFAULTS INCLUDING IDENTITY);
CREATE TABLE IF NOT EXISTS public.audit_log_archive     (LIKE public.audit_log     INCLUDING DEFAULTS INCLUDING IDENTITY);

CREATE INDEX IF NOT EXISTS idx_kgd_archive_created ON public.kho_giao_dich_archive (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_archive_created ON public.audit_log_archive (created_at DESC);

GRANT SELECT ON public.kho_giao_dich_archive TO authenticated;
GRANT SELECT ON public.audit_log_archive TO authenticated;
GRANT ALL ON public.kho_giao_dich_archive TO service_role;
GRANT ALL ON public.audit_log_archive TO service_role;

ALTER TABLE public.kho_giao_dich_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kgd_archive_admin_read" ON public.kho_giao_dich_archive
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "audit_archive_admin_read" ON public.audit_log_archive
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ============ View hợp nhất để truy vấn xuyên suốt ============
CREATE OR REPLACE VIEW public.v_kho_giao_dich_all
  WITH (security_invoker = true) AS
SELECT * FROM public.kho_giao_dich
UNION ALL
SELECT * FROM public.kho_giao_dich_archive;

CREATE OR REPLACE VIEW public.v_audit_log_all
  WITH (security_invoker = true) AS
SELECT * FROM public.audit_log
UNION ALL
SELECT * FROM public.audit_log_archive;

GRANT SELECT ON public.v_kho_giao_dich_all TO authenticated;
GRANT SELECT ON public.v_audit_log_all TO authenticated;

-- ============ Index hỗ trợ archival job ============
CREATE INDEX IF NOT EXISTS idx_kgd_created_at ON public.kho_giao_dich (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log (created_at);

-- ============ RPC: dịch dữ liệu cũ sang archive ============
CREATE OR REPLACE FUNCTION public.dich_du_lieu_cu(
  bang text,
  so_thang_giu_lai integer DEFAULT 12
)
RETURNS TABLE(so_ban_ghi bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff timestamptz := now() - (so_thang_giu_lai || ' months')::interval;
  moved bigint := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin được dịch dữ liệu';
  END IF;
  IF so_thang_giu_lai < 1 THEN
    RAISE EXCEPTION 'so_thang_giu_lai phải >= 1';
  END IF;

  IF bang = 'kho_giao_dich' THEN
    WITH moved_rows AS (
      DELETE FROM public.kho_giao_dich
      WHERE created_at < cutoff
      RETURNING *
    ), ins AS (
      INSERT INTO public.kho_giao_dich_archive SELECT * FROM moved_rows
      RETURNING 1
    )
    SELECT count(*) INTO moved FROM ins;
  ELSIF bang = 'audit_log' THEN
    WITH moved_rows AS (
      DELETE FROM public.audit_log
      WHERE created_at < cutoff
      RETURNING *
    ), ins AS (
      INSERT INTO public.audit_log_archive SELECT * FROM moved_rows
      RETURNING 1
    )
    SELECT count(*) INTO moved FROM ins;
  ELSE
    RAISE EXCEPTION 'Bảng không hỗ trợ archival: %', bang;
  END IF;

  RETURN QUERY SELECT moved;
END;
$$;

REVOKE ALL ON FUNCTION public.dich_du_lieu_cu(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dich_du_lieu_cu(text, integer) TO authenticated;