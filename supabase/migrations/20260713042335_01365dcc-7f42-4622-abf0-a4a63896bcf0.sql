-- ============================================================================
-- Checklist mẫu theo SECTION (VD: "Cảm biến", "Tủ phụ trợ") + ITEM kiểm tra.
-- Cho phép mẫu bảo dưỡng dạng bảng kiểm: mỗi hạng mục có tên, hướng dẫn,
-- kiểu kết quả (result_kind), giá trị đo, đơn vị, tiêu chuẩn, kết quả, ghi chú,
-- và HÀNH ĐỘNG (bắt buộc khi Không đạt). Giá trị số lưu dạng numeric, KHÔNG lưu chuỗi.
-- ============================================================================

-- Kiểu kết quả của 1 hạng mục kiểm tra
DO $$ BEGIN
  CREATE TYPE public.form_result_kind AS ENUM ('so', 'dat_khong_dat', 'chon', 'text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Kết luận của 1 hạng mục khi lập phiếu
DO $$ BEGIN
  CREATE TYPE public.form_ket_qua AS ENUM ('dat', 'khong_dat', 'khong_ap_dung');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 1) form_section — nhóm hạng mục trong 1 mẫu (thuộc phiên bản hiện tại của mẫu)
-- ---------------------------------------------------------------------------
CREATE TABLE public.form_section (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id uuid NOT NULL REFERENCES public.form_template(id) ON DELETE CASCADE,
  ma_section text NOT NULL,
  ten text NOT NULL,
  mo_ta text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, ma_section)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_section TO authenticated;
GRANT ALL ON public.form_section TO service_role;
ALTER TABLE public.form_section ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_section_select_active ON public.form_section
  FOR SELECT TO authenticated USING (is_active_user(auth.uid()));
CREATE POLICY form_section_manage_kt ON public.form_section
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- ---------------------------------------------------------------------------
-- 2) form_check_item — hạng mục kiểm tra; item_code ỔN ĐỊNH & UNIQUE trong mẫu
-- ---------------------------------------------------------------------------
CREATE TABLE public.form_check_item (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id uuid NOT NULL REFERENCES public.form_section(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.form_template(id) ON DELETE CASCADE,
  item_code text NOT NULL,
  ten text NOT NULL,
  huong_dan text,
  result_kind public.form_result_kind NOT NULL DEFAULT 'text',
  don_vi text,
  tieu_chuan text,
  tuy_chon jsonb,
  bat_buoc boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- item_code duy nhất trong phạm vi 1 mẫu (= phiên bản hiện tại)
  UNIQUE (template_id, item_code)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_check_item TO authenticated;
GRANT ALL ON public.form_check_item TO service_role;
ALTER TABLE public.form_check_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY form_check_item_select_active ON public.form_check_item
  FOR SELECT TO authenticated USING (is_active_user(auth.uid()));
CREATE POLICY form_check_item_manage_kt ON public.form_check_item
  FOR ALL TO authenticated
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_form_check_item_section ON public.form_check_item(section_id);
CREATE INDEX idx_form_check_item_template ON public.form_check_item(template_id);

-- ---------------------------------------------------------------------------
-- 3) form_submission_item_result — kết quả 1 hạng mục trong 1 phiếu đã lập.
--    Ghim snapshot (item_code, tên, đơn vị, tiêu chuẩn) để lịch sử không đổi.
--    gia_tri_so lưu NUMERIC (số thật), gia_tri_text cho các kiểu khác.
-- ---------------------------------------------------------------------------
CREATE TABLE public.form_submission_item_result (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.form_submission(id) ON DELETE CASCADE,
  section_code text NOT NULL,
  section_ten text,
  item_code text NOT NULL,
  ten text NOT NULL,
  result_kind public.form_result_kind NOT NULL,
  gia_tri_so numeric,
  gia_tri_text text,
  don_vi text,
  tieu_chuan text,
  ket_qua public.form_ket_qua,
  ghi_chu text,
  hanh_dong text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, item_code),
  -- KHÔNG ĐẠT bắt buộc phải có HÀNH ĐỘNG khắc phục
  CONSTRAINT chk_khong_dat_can_hanh_dong
    CHECK (ket_qua IS DISTINCT FROM 'khong_dat' OR (hanh_dong IS NOT NULL AND btrim(hanh_dong) <> ''))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.form_submission_item_result TO authenticated;
GRANT ALL ON public.form_submission_item_result TO service_role;
ALTER TABLE public.form_submission_item_result ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fsir_submission ON public.form_submission_item_result(submission_id);

-- Đọc theo phạm vi của phiếu cha (mirror form_submission_select_scope)
CREATE POLICY fsir_select_scope ON public.form_submission_item_result
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.form_submission s
    WHERE s.id = submission_id
      AND is_active_user(auth.uid())
      AND (
        can_manage_equipment(auth.uid())
        OR s.created_by = auth.uid()
        OR (s.status <> 'draft' AND s.don_vi_id IS NOT NULL AND s.don_vi_id = get_user_don_vi_id(auth.uid()))
      )
  ));

-- Người tạo phiếu (nháp/trả lại) hoặc KT được ghi/sửa/xoá kết quả của phiếu đó
CREATE POLICY fsir_write_owner_or_kt ON public.form_submission_item_result
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.form_submission s
    WHERE s.id = submission_id
      AND (can_manage_equipment(auth.uid())
           OR (s.created_by = auth.uid() AND s.status IN ('draft','submitted','returned')))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.form_submission s
    WHERE s.id = submission_id
      AND (can_manage_equipment(auth.uid())
           OR (s.created_by = auth.uid() AND s.status IN ('draft','submitted','returned')))
  ));

-- updated_at triggers
CREATE TRIGGER trg_form_section_updated BEFORE UPDATE ON public.form_section
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_form_check_item_updated BEFORE UPDATE ON public.form_check_item
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_fsir_updated BEFORE UPDATE ON public.form_submission_item_result
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();