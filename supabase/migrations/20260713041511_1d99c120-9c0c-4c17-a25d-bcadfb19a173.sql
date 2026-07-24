-- ============================================================
-- Phiên bản mẫu biên bản (form_template_version) + ghim snapshot vào phiếu
-- Mục tiêu: sửa mẫu/field sau khi lập phiếu KHÔNG làm đổi phiếu cũ.
-- KHÔNG drop bảng/cột cũ.
-- ============================================================

-- 1) Enum trạng thái version
DO $$ BEGIN
  CREATE TYPE public.form_template_version_status AS ENUM ('draft', 'published', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Bảng form_template_version
CREATE TABLE IF NOT EXISTS public.form_template_version (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.form_template(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status public.form_template_version_status NOT NULL DEFAULT 'draft',
  compiled_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);

CREATE INDEX IF NOT EXISTS idx_ftv_template ON public.form_template_version(template_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_template_version TO authenticated;
GRANT ALL ON public.form_template_version TO service_role;

ALTER TABLE public.form_template_version ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ftv_select_active ON public.form_template_version;
CREATE POLICY ftv_select_active ON public.form_template_version
  FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));

DROP POLICY IF EXISTS ftv_manage_kt ON public.form_template_version;
CREATE POLICY ftv_manage_kt ON public.form_template_version
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

-- trigger updated_at
DROP TRIGGER IF EXISTS trg_ftv_updated_at ON public.form_template_version;
CREATE TRIGGER trg_ftv_updated_at
  BEFORE UPDATE ON public.form_template_version
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Ghim version + snapshot vào phiếu (không xoá cột cũ template_version integer)
ALTER TABLE public.form_submission
  ADD COLUMN IF NOT EXISTS template_version_id UUID REFERENCES public.form_template_version(id),
  ADD COLUMN IF NOT EXISTS template_snapshot JSONB;
