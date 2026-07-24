-- ============================================================
-- Tầng Model thiết bị (Asset Model) kiểu Snipe-IT
-- ============================================================
CREATE TABLE public.dm_model (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma text,
  ten text NOT NULL,
  so_model text,
  nha_san_xuat_id uuid REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL,
  loai_thiet_bi_id uuid REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL,
  field_set_id uuid REFERENCES public.field_set(id) ON DELETE SET NULL,
  hinh_anh text,
  mo_ta text,
  thu_tu integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_model TO authenticated;
GRANT ALL ON public.dm_model TO service_role;

ALTER TABLE public.dm_model ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lookup_read_active" ON public.dm_model
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

CREATE POLICY "lookup_write_manager" ON public.dm_model
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_dm_model_nsx ON public.dm_model(nha_san_xuat_id);
CREATE INDEX idx_dm_model_loai ON public.dm_model(loai_thiet_bi_id);

CREATE TRIGGER update_dm_model_updated_at
  BEFORE UPDATE ON public.dm_model
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Thiết bị trỏ tới Model (catalog). Chặn xoá model khi còn thiết bị tham chiếu.
ALTER TABLE public.thiet_bi
  ADD COLUMN model_id uuid REFERENCES public.dm_model(id) ON DELETE RESTRICT;

CREATE INDEX idx_thiet_bi_model ON public.thiet_bi(model_id);