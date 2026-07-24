DROP TRIGGER IF EXISTS trg_audit_he_thong_thanh_phan ON public.he_thong_thanh_phan;
CREATE TRIGGER trg_audit_he_thong_thanh_phan
  AFTER INSERT OR UPDATE OR DELETE ON public.he_thong_thanh_phan
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();