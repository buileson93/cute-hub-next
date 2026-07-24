-- ============================================================================
-- MÔ HÌNH 3 LỚP — BƯỚC 2: RLS + trigger đồng bộ CACHE + validate + audit.
-- ============================================================================

-- 0. updated_at cho he_thong_thanh_phan.
CREATE OR REPLACE FUNCTION public.trg_http_touch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS http_touch ON public.he_thong_thanh_phan;
CREATE TRIGGER http_touch BEFORE UPDATE ON public.he_thong_thanh_phan
  FOR EACH ROW EXECUTE FUNCTION public.trg_http_touch();

-- 1. BEFORE UPDATE he_thong_thanh_phan: chặn NGỪNG khi còn thiết bị hiệu lực (INVARIANT 8).
CREATE OR REPLACE FUNCTION public.trg_http_before()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.trang_thai = 'ngung' AND COALESCE(OLD.trang_thai,'') <> 'ngung' THEN
    IF EXISTS (
      SELECT 1 FROM public.gan_chuc_nang g
      WHERE g.thanh_phan_id = NEW.id AND g.den_ngay IS NULL
    ) THEN
      RAISE EXCEPTION 'Phải tháo thiết bị trước khi ngừng vị trí chức năng';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS http_before ON public.he_thong_thanh_phan;
CREATE TRIGGER http_before BEFORE UPDATE ON public.he_thong_thanh_phan
  FOR EACH ROW EXECUTE FUNCTION public.trg_http_before();

-- 2. BEFORE INSERT/UPDATE gan_chuc_nang: snapshot đơn vị + validate loại + chặn vị trí ngừng.
CREATE OR REPLACE FUNCTION public.trg_gcn_before()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tp             public.he_thong_thanh_phan%ROWTYPE;
  v_loai_tb        uuid;
  v_don_vi         uuid;
BEGIN
  SELECT * INTO v_tp FROM public.he_thong_thanh_phan WHERE id = NEW.thanh_phan_id;

  -- Chặn gán vào vị trí đã ngừng (chỉ khi tạo dòng hiệu lực mới).
  IF TG_OP = 'INSERT' AND NEW.den_ngay IS NULL AND v_tp.trang_thai = 'ngung' THEN
    RAISE EXCEPTION 'Vị trí chức năng đã ngừng, không thể gán thiết bị';
  END IF;

  -- Validate loại thiết bị đúng yêu cầu của vị trí.
  IF v_tp.loai_thiet_bi_yeu_cau IS NOT NULL THEN
    SELECT loai_thiet_bi_id INTO v_loai_tb FROM public.thiet_bi WHERE id = NEW.thiet_bi_id;
    IF v_loai_tb IS DISTINCT FROM v_tp.loai_thiet_bi_yeu_cau THEN
      RAISE EXCEPTION 'Thiết bị không đúng loại yêu cầu của vị trí chức năng';
    END IF;
  END IF;

  -- Đóng băng đơn vị (theo thiết bị đang lắp).
  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO v_don_vi
    FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS gcn_before ON public.gan_chuc_nang;
CREATE TRIGGER gcn_before BEFORE INSERT OR UPDATE ON public.gan_chuc_nang
  FOR EACH ROW EXECUTE FUNCTION public.trg_gcn_before();

-- 3. Helper: đồng bộ CACHE thiet_bi.he_thong_id / nhom_he_thong_id theo dòng hiệu lực.
CREATE OR REPLACE FUNCTION public.sync_thiet_bi_he_thong_cache(p_thiet_bi_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_he_thong_id  uuid;
  v_nhom_id      uuid;
BEGIN
  IF p_thiet_bi_id IS NULL THEN RETURN; END IF;

  SELECT tp.he_thong_id INTO v_he_thong_id
  FROM public.gan_chuc_nang g
  JOIN public.he_thong_thanh_phan tp ON tp.id = g.thanh_phan_id
  WHERE g.thiet_bi_id = p_thiet_bi_id AND g.den_ngay IS NULL
  LIMIT 1;

  IF v_he_thong_id IS NOT NULL THEN
    SELECT nhom_he_thong_id INTO v_nhom_id FROM public.dm_he_thong WHERE id = v_he_thong_id;
    UPDATE public.thiet_bi
      SET he_thong_id = v_he_thong_id,
          nhom_he_thong_id = COALESCE(v_nhom_id, nhom_he_thong_id)
      WHERE id = p_thiet_bi_id;
  ELSE
    UPDATE public.thiet_bi SET he_thong_id = NULL WHERE id = p_thiet_bi_id;
  END IF;
END;
$$;

-- 4. AFTER INSERT/UPDATE/DELETE gan_chuc_nang: đồng bộ cache cho thiết bị liên quan.
CREATE OR REPLACE FUNCTION public.trg_gcn_after()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.thiet_bi_id IS NOT NULL THEN
    PERFORM public.sync_thiet_bi_he_thong_cache(OLD.thiet_bi_id);
  END IF;
  IF TG_OP <> 'DELETE' AND NEW.thiet_bi_id IS NOT NULL THEN
    PERFORM public.sync_thiet_bi_he_thong_cache(NEW.thiet_bi_id);
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
DROP TRIGGER IF EXISTS gcn_after ON public.gan_chuc_nang;
CREATE TRIGGER gcn_after AFTER INSERT OR UPDATE OR DELETE ON public.gan_chuc_nang
  FOR EACH ROW EXECUTE FUNCTION public.trg_gcn_after();

-- 5. Audit chung cho 2 bảng (mẫu trg_tbkn_audit).
CREATE OR REPLACE FUNCTION public.trg_layer3_audit()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity, entity_id, detail)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
DROP TRIGGER IF EXISTS http_audit ON public.he_thong_thanh_phan;
CREATE TRIGGER http_audit AFTER INSERT OR UPDATE OR DELETE ON public.he_thong_thanh_phan
  FOR EACH ROW EXECUTE FUNCTION public.trg_layer3_audit();
DROP TRIGGER IF EXISTS gcn_audit ON public.gan_chuc_nang;
CREATE TRIGGER gcn_audit AFTER INSERT OR UPDATE OR DELETE ON public.gan_chuc_nang
  FOR EACH ROW EXECUTE FUNCTION public.trg_layer3_audit();

-- 6. RLS: he_thong_thanh_phan.
ALTER TABLE public.he_thong_thanh_phan ENABLE ROW LEVEL SECURITY;

CREATE POLICY http_select ON public.he_thong_thanh_phan
  FOR SELECT USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.dm_he_thong h
        WHERE h.id = he_thong_thanh_phan.he_thong_id
          AND h.don_vi_id = get_user_don_vi_id(auth.uid())
      )
    )
  );

CREATE POLICY http_write_manager ON public.he_thong_thanh_phan
  FOR ALL
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 7. RLS: gan_chuc_nang.
ALTER TABLE public.gan_chuc_nang ENABLE ROW LEVEL SECURITY;

CREATE POLICY gcn_select ON public.gan_chuc_nang
  FOR SELECT USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR can_view_thiet_bi(thiet_bi_id, auth.uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );

CREATE POLICY gcn_write_manager ON public.gan_chuc_nang
  FOR ALL
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));