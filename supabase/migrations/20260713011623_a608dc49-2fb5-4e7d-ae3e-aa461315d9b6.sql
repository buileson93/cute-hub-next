-- ============================================================================
-- Từ điển alias cho nhập liệu: ánh xạ văn bản đầu vào (tên/mã gõ khác) tới một
-- bản ghi chuẩn, có scope/entity/source và audit người xác nhận. Dùng để đối
-- chiếu (entity resolution) ổn định giữa các lần nhập.
-- ============================================================================

CREATE TABLE public.import_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity text NOT NULL,
  scope text,
  source text NOT NULL DEFAULT 'manual',
  alias text NOT NULL,
  alias_norm text NOT NULL,
  canonical_id uuid NOT NULL,
  canonical_key text,
  confirmed_by uuid NOT NULL DEFAULT auth.uid(),
  confirmed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT import_alias_source_chk CHECK (source IN ('manual', 'import', 'ai'))
);

-- Một alias (đã chuẩn hoá) là duy nhất trong phạm vi (entity, scope).
CREATE UNIQUE INDEX uq_import_alias ON public.import_alias (entity, COALESCE(scope, ''), alias_norm);
CREATE INDEX idx_import_alias_lookup ON public.import_alias (entity, alias_norm);
CREATE INDEX idx_import_alias_canonical ON public.import_alias (canonical_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_alias TO authenticated;
GRANT ALL ON public.import_alias TO service_role;

ALTER TABLE public.import_alias ENABLE ROW LEVEL SECURITY;

-- Người dùng đang hoạt động được xem để đối chiếu.
CREATE POLICY import_alias_select ON public.import_alias
  FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));

-- Chỉ admin được tạo/sửa/xóa alias; người xác nhận phải là chính mình.
CREATE POLICY import_alias_insert ON public.import_alias
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND confirmed_by = auth.uid());

CREATE POLICY import_alias_update ON public.import_alias
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY import_alias_delete ON public.import_alias
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER import_alias_set_updated_at
  BEFORE UPDATE ON public.import_alias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
