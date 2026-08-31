
CREATE TYPE public.bao_cao_trang_thai AS ENUM ('cho_duyet','da_duyet','yeu_cau_sua','huy');

CREATE TABLE public.du_an_bao_cao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  du_an_id uuid NOT NULL REFERENCES public.du_an(id) ON DELETE CASCADE,
  cong_viec_id uuid REFERENCES public.du_an_cong_viec(id) ON DELETE SET NULL,
  tieu_de text NOT NULL,
  noi_dung text,
  bang_chung text,
  tep_url text,
  nguoi_nop_id uuid NOT NULL DEFAULT current_uid(),
  trang_thai public.bao_cao_trang_thai NOT NULL DEFAULT 'cho_duyet',
  y_kien_lanh_dao text,
  nguoi_duyet_id uuid,
  ngay_duyet timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_du_an_bao_cao_du_an ON public.du_an_bao_cao(du_an_id);
CREATE INDEX idx_du_an_bao_cao_cong_viec ON public.du_an_bao_cao(cong_viec_id);
CREATE INDEX idx_du_an_bao_cao_trang_thai ON public.du_an_bao_cao(trang_thai);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_bao_cao TO authenticated;
GRANT ALL ON public.du_an_bao_cao TO service_role;

ALTER TABLE public.du_an_bao_cao ENABLE ROW LEVEL SECURITY;

CREATE POLICY du_an_bao_cao_select ON public.du_an_bao_cao FOR SELECT TO authenticated
  USING (public.can_access_du_an(du_an_id, public.current_uid()));

CREATE POLICY du_an_bao_cao_insert ON public.du_an_bao_cao FOR INSERT TO authenticated
  WITH CHECK (
    public.can_access_du_an(du_an_id, public.current_uid())
    AND nguoi_nop_id = public.current_uid()
  );

CREATE POLICY du_an_bao_cao_update ON public.du_an_bao_cao FOR UPDATE TO authenticated
  USING (
    public.can_manage_du_an(du_an_id, public.current_uid())
    OR (nguoi_nop_id = public.current_uid() AND trang_thai IN ('cho_duyet','yeu_cau_sua'))
  );

CREATE POLICY du_an_bao_cao_delete ON public.du_an_bao_cao FOR DELETE TO authenticated
  USING (
    public.can_manage_du_an(du_an_id, public.current_uid())
    OR (nguoi_nop_id = public.current_uid() AND trang_thai = 'cho_duyet')
  );

-- Chỉ người quản lý dự án mới được đổi trạng thái duyệt / ghi ý kiến lãnh đạo,
-- và khi duyệt thì công việc liên quan tự chuyển 100% / hoàn thành.
CREATE OR REPLACE FUNCTION public.fn_du_an_bao_cao_duyet()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    IF NOT public.can_manage_du_an(NEW.du_an_id, public.current_uid()) THEN
      RAISE EXCEPTION 'Chỉ người quản lý dự án được phê duyệt báo cáo';
    END IF;
    IF NEW.trang_thai IN ('da_duyet','yeu_cau_sua','huy') THEN
      NEW.nguoi_duyet_id := public.current_uid();
      NEW.ngay_duyet := now();
    END IF;
    IF NEW.trang_thai = 'da_duyet' AND NEW.cong_viec_id IS NOT NULL THEN
      UPDATE public.du_an_cong_viec
        SET trang_thai = 'hoan_thanh', tien_do = 100
        WHERE id = NEW.cong_viec_id;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_du_an_bao_cao_duyet
BEFORE UPDATE ON public.du_an_bao_cao
FOR EACH ROW EXECUTE FUNCTION public.fn_du_an_bao_cao_duyet();
