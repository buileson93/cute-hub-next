
CREATE TABLE public.dot_bao_duong_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hang_muc_id uuid NOT NULL REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE,
  dot_id uuid NOT NULL REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE,
  don_vi_id uuid,
  action text NOT NULL,
  actor uuid,
  changes jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ix_dbd_audit_hm ON public.dot_bao_duong_audit_log(hang_muc_id, created_at DESC);
CREATE INDEX ix_dbd_audit_dot ON public.dot_bao_duong_audit_log(dot_id, created_at DESC);

GRANT SELECT, INSERT ON public.dot_bao_duong_audit_log TO authenticated;
GRANT ALL ON public.dot_bao_duong_audit_log TO service_role;

ALTER TABLE public.dot_bao_duong_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY dbd_audit_select ON public.dot_bao_duong_audit_log
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'phong_kt'::app_role)
    OR don_vi_id = public.get_user_don_vi_id(auth.uid())
  );

CREATE POLICY dbd_audit_insert ON public.dot_bao_duong_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger: hang muc changes
CREATE OR REPLACE FUNCTION public.trg_dbd_hm_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
  v_changes jsonb := '{}'::jsonb;
  v_note text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
    VALUES (NEW.id, NEW.dot_id, NEW.don_vi_id, 'tao', auth.uid(),
      jsonb_build_object('he_thong_id', NEW.he_thong_id, 'nguon', NEW.nguon, 'han_hoan_thanh', NEW.han_hoan_thanh));
    RETURN NEW;
  END IF;

  -- UPDATE: detect state transitions first
  IF NEW.duyet_trang_thai IS DISTINCT FROM OLD.duyet_trang_thai THEN
    v_action := CASE NEW.duyet_trang_thai
      WHEN 'cho_duyet' THEN 'gui_duyet'
      WHEN 'da_duyet' THEN 'duyet'
      WHEN 'tu_choi' THEN 'tra_lai'
      WHEN 'chua_gui' THEN 'mo_khoa'
      ELSE 'cap_nhat'
    END;
    v_note := NEW.approval_note;
  ELSE
    v_action := 'cap_nhat';
  END IF;

  IF NEW.trang_thai IS DISTINCT FROM OLD.trang_thai THEN
    v_changes := v_changes || jsonb_build_object('trang_thai', jsonb_build_array(OLD.trang_thai, NEW.trang_thai));
  END IF;
  IF NEW.ket_qua IS DISTINCT FROM OLD.ket_qua THEN
    v_changes := v_changes || jsonb_build_object('ket_qua', jsonb_build_array(OLD.ket_qua, NEW.ket_qua));
  END IF;
  IF NEW.duyet_trang_thai IS DISTINCT FROM OLD.duyet_trang_thai THEN
    v_changes := v_changes || jsonb_build_object('duyet_trang_thai', jsonb_build_array(OLD.duyet_trang_thai, NEW.duyet_trang_thai));
  END IF;
  IF NEW.han_hoan_thanh IS DISTINCT FROM OLD.han_hoan_thanh THEN
    v_changes := v_changes || jsonb_build_object('han_hoan_thanh', jsonb_build_array(OLD.han_hoan_thanh, NEW.han_hoan_thanh));
  END IF;
  IF NEW.ton_tai IS DISTINCT FROM OLD.ton_tai THEN
    v_changes := v_changes || jsonb_build_object('ton_tai', jsonb_build_array(COALESCE(OLD.ton_tai,''), COALESCE(NEW.ton_tai,'')));
  END IF;
  IF NEW.kien_nghi IS DISTINCT FROM OLD.kien_nghi THEN
    v_changes := v_changes || jsonb_build_object('kien_nghi', jsonb_build_array(COALESCE(OLD.kien_nghi,''), COALESCE(NEW.kien_nghi,'')));
  END IF;

  -- Skip pure no-op updates
  IF v_action = 'cap_nhat' AND v_changes = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes, note)
  VALUES (NEW.id, NEW.dot_id, NEW.don_vi_id, v_action, auth.uid(), v_changes, v_note);

  RETURN NEW;
END;
$$;

CREATE TRIGGER dbd_hm_audit_ins AFTER INSERT ON public.dot_bao_duong_hang_muc
  FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_hm_audit();
CREATE TRIGGER dbd_hm_audit_upd AFTER UPDATE ON public.dot_bao_duong_hang_muc
  FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_hm_audit();

-- Trigger: bien ban attach/detach
CREATE OR REPLACE FUNCTION public.trg_dbd_bb_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hm RECORD;
  v_fs_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT dot_id, don_vi_id INTO v_hm FROM public.dot_bao_duong_hang_muc WHERE id = NEW.hang_muc_id;
    INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
    VALUES (NEW.hang_muc_id, v_hm.dot_id, v_hm.don_vi_id, 'gan_bien_ban', auth.uid(),
      jsonb_build_object('form_submission_id', NEW.form_submission_id));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT dot_id, don_vi_id INTO v_hm FROM public.dot_bao_duong_hang_muc WHERE id = OLD.hang_muc_id;
    IF FOUND THEN
      INSERT INTO public.dot_bao_duong_audit_log(hang_muc_id, dot_id, don_vi_id, action, actor, changes)
      VALUES (OLD.hang_muc_id, v_hm.dot_id, v_hm.don_vi_id, 'go_bien_ban', auth.uid(),
        jsonb_build_object('form_submission_id', OLD.form_submission_id));
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER dbd_bb_audit_ins AFTER INSERT ON public.dot_bao_duong_bien_ban
  FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_bb_audit();
CREATE TRIGGER dbd_bb_audit_del AFTER DELETE ON public.dot_bao_duong_bien_ban
  FOR EACH ROW EXECUTE FUNCTION public.trg_dbd_bb_audit();
