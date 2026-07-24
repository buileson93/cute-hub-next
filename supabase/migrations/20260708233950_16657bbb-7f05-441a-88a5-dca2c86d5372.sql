
DROP TRIGGER IF EXISTS trg_bao_tri_updated ON public.bao_tri;
DROP TRIGGER IF EXISTS trg_su_co_updated ON public.su_co;
DROP TRIGGER IF EXISTS trg_hong_hoc_updated ON public.hong_hoc;
DROP TRIGGER IF EXISTS trg_ban_giao_updated ON public.ban_giao;
CREATE TRIGGER trg_bao_tri_updated BEFORE UPDATE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_su_co_updated BEFORE UPDATE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_hong_hoc_updated BEFORE UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_ban_giao_updated BEFORE UPDATE ON public.ban_giao FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_bao_tri_audit ON public.bao_tri;
DROP TRIGGER IF EXISTS trg_su_co_audit ON public.su_co;
DROP TRIGGER IF EXISTS trg_hong_hoc_audit ON public.hong_hoc;
DROP TRIGGER IF EXISTS trg_ban_giao_audit ON public.ban_giao;
CREATE TRIGGER trg_bao_tri_audit AFTER INSERT OR UPDATE OR DELETE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_su_co_audit AFTER INSERT OR UPDATE OR DELETE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_hong_hoc_audit AFTER INSERT OR UPDATE OR DELETE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_ban_giao_audit AFTER INSERT OR UPDATE OR DELETE ON public.ban_giao FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
