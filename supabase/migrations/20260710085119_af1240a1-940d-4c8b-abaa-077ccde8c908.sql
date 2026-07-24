-- 1) Phân loại mẫu biên bản: 'bien_ban' (mặc định) | 'bao_duong'
ALTER TABLE public.form_template
  ADD COLUMN IF NOT EXISTS nhom text NOT NULL DEFAULT 'bien_ban';

-- 2) Liên kết mẫu phiếu ↔ hệ thống cụ thể
CREATE TABLE IF NOT EXISTS public.form_template_he_thong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.form_template(id) ON DELETE CASCADE,
  he_thong_id uuid NOT NULL REFERENCES public.dm_he_thong(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, he_thong_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_template_he_thong TO authenticated;
GRANT ALL ON public.form_template_he_thong TO service_role;

ALTER TABLE public.form_template_he_thong ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_tpl_ht_select ON public.form_template_he_thong
  FOR SELECT USING (is_active_user(auth.uid()));

CREATE POLICY form_tpl_ht_manage ON public.form_template_he_thong
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_form_tpl_ht_he_thong ON public.form_template_he_thong(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_form_tpl_ht_template ON public.form_template_he_thong(template_id);

-- 3) Ngữ cảnh hệ thống cho phiếu đã nộp + liên kết bản ghi bảo dưỡng ↔ phiếu
ALTER TABLE public.form_submission
  ADD COLUMN IF NOT EXISTS he_thong_id uuid REFERENCES public.dm_he_thong(id);

ALTER TABLE public.bao_tri
  ADD COLUMN IF NOT EXISTS form_submission_id uuid REFERENCES public.form_submission(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bao_tri_form_submission ON public.bao_tri(form_submission_id);