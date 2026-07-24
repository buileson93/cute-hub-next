-- 1) Mở rộng he_thong_truong: help_text, nhom_field; chuyển mac_dinh sang jsonb.
ALTER TABLE public.he_thong_truong ADD COLUMN IF NOT EXISTS help_text text;
ALTER TABLE public.he_thong_truong ADD COLUMN IF NOT EXISTS nhom_field text;
ALTER TABLE public.he_thong_truong ADD COLUMN IF NOT EXISTS bat_buoc boolean NOT NULL DEFAULT false;
ALTER TABLE public.he_thong_truong ALTER COLUMN rang_buoc SET DEFAULT '{}'::jsonb;

-- mac_dinh: text -> jsonb (bọc giá trị text hiện có thành JSON string)
ALTER TABLE public.he_thong_truong
  ALTER COLUMN mac_dinh TYPE jsonb
  USING (CASE WHEN mac_dinh IS NULL THEN NULL ELSE to_jsonb(mac_dinh) END);

-- 2) Bảng nhóm field dùng lại
CREATE TABLE IF NOT EXISTS public.field_set (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ten text NOT NULL,
  mo_ta text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_set TO authenticated;
GRANT ALL ON public.field_set TO service_role;
ALTER TABLE public.field_set ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read field_set" ON public.field_set FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "admin manage field_set" ON public.field_set FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_field_set_updated_at BEFORE UPDATE ON public.field_set FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.field_set_item (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_set_id uuid NOT NULL REFERENCES public.field_set(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  thu_tu integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_set_id, field_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.field_set_item TO authenticated;
GRANT ALL ON public.field_set_item TO service_role;
ALTER TABLE public.field_set_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read field_set_item" ON public.field_set_item FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY "admin manage field_set_item" ON public.field_set_item FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_field_set_item_updated_at BEFORE UPDATE ON public.field_set_item FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) Trigger validate_thuoc_tinh: kiểm bat_buoc + rang_buoc (regex/min/max)
CREATE OR REPLACE FUNCTION public.validate_thuoc_tinh()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  k text; v jsonb; reg record;
  v_regex text; v_min numeric; v_max numeric; v_num numeric; v_txt text;
BEGIN
  -- (a) Các trường bắt buộc phải có giá trị (không null/không rỗng)
  FOR reg IN
    SELECT r.field_key, r.nhan FROM public.he_thong_truong r
    WHERE r.hoat_dong = true AND r.ap_dung_lop = 'thiet_bi' AND r.bat_buoc = true
      AND (
        r.pham_vi = 'toan_cuc'
        OR (r.pham_vi = 'he_thong' AND r.ap_dung_id = NEW.he_thong_id::text)
        OR (r.pham_vi = 'linh_vuc' AND r.ap_dung_id = NEW.linh_vuc_id::text)
        OR (r.pham_vi = 'nhom'     AND r.ap_dung_id = NEW.nhom_he_thong_id::text)
      )
  LOOP
    IF NOT (COALESCE(NEW.thuoc_tinh, '{}'::jsonb) ? reg.field_key)
       OR NEW.thuoc_tinh->reg.field_key = 'null'::jsonb
       OR btrim(COALESCE(NEW.thuoc_tinh->>reg.field_key, '')) = '' THEN
      RAISE EXCEPTION 'Trường "%" là bắt buộc', COALESCE(reg.nhan, reg.field_key);
    END IF;
  END LOOP;

  IF NEW.thuoc_tinh IS NULL OR NEW.thuoc_tinh = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- (b) Từng trường ghi vào: đã khai báo + kiểu + ràng buộc
  FOR k, v IN SELECT key, value FROM jsonb_each(NEW.thuoc_tinh) LOOP
    SELECT * INTO reg FROM public.he_thong_truong r
      WHERE r.field_key = k AND r.hoat_dong = true AND r.ap_dung_lop = 'thiet_bi'
        AND (
          r.pham_vi = 'toan_cuc'
          OR (r.pham_vi = 'he_thong' AND r.ap_dung_id = NEW.he_thong_id::text)
          OR (r.pham_vi = 'linh_vuc' AND r.ap_dung_id = NEW.linh_vuc_id::text)
          OR (r.pham_vi = 'nhom'     AND r.ap_dung_id = NEW.nhom_he_thong_id::text)
        )
      LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Trường "%" chưa được khai báo trong phạm vi áp dụng (he_thong_truong)', k;
    END IF;

    -- bỏ qua kiểm kiểu/ràng buộc khi giá trị rỗng/null
    IF v IS NULL OR v = 'null'::jsonb OR (jsonb_typeof(v) = 'string' AND btrim(v#>>'{}') = '') THEN
      CONTINUE;
    END IF;

    IF reg.kieu = 'number' AND jsonb_typeof(v) NOT IN ('number','string') THEN
      RAISE EXCEPTION 'Trường "%" phải là số', COALESCE(reg.nhan, k);
    END IF;

    v_txt := v#>>'{}';

    v_regex := NULLIF(reg.rang_buoc->>'regex','');
    IF v_regex IS NOT NULL AND v_txt IS NOT NULL AND v_txt !~ v_regex THEN
      RAISE EXCEPTION 'Trường "%" không đúng định dạng', COALESCE(reg.nhan, k);
    END IF;

    IF (reg.rang_buoc ? 'min') OR (reg.rang_buoc ? 'max') THEN
      BEGIN
        v_num := v_txt::numeric;
      EXCEPTION WHEN others THEN
        v_num := NULL;
      END;
      IF v_num IS NOT NULL THEN
        v_min := NULLIF(reg.rang_buoc->>'min','')::numeric;
        v_max := NULLIF(reg.rang_buoc->>'max','')::numeric;
        IF v_min IS NOT NULL AND v_num < v_min THEN
          RAISE EXCEPTION 'Trường "%" phải >= %', COALESCE(reg.nhan, k), v_min;
        END IF;
        IF v_max IS NOT NULL AND v_num > v_max THEN
          RAISE EXCEPTION 'Trường "%" phải <= %', COALESCE(reg.nhan, k), v_max;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;