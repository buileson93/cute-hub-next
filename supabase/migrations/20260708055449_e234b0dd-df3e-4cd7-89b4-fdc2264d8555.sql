
-- STATUS ENUMS
DO $$ BEGIN
  CREATE TYPE public.du_an_trang_thai AS ENUM ('moi','dang_thuc_hien','tam_dung','hoan_thanh','huy');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.cong_viec_trang_thai AS ENUM ('chua_bat_dau','dang_lam','cho_duyet','hoan_thanh','qua_han');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLE: du_an
CREATE TABLE IF NOT EXISTS public.du_an (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text UNIQUE,
  ten text NOT NULL,
  mo_ta text,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  nguoi_tao_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  quan_ly_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  ngay_bat_dau date,
  ngay_ket_thuc_du_kien date,
  trang_thai du_an_trang_thai NOT NULL DEFAULT 'moi',
  tien_do smallint NOT NULL DEFAULT 0 CHECK (tien_do BETWEEN 0 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_du_an_quan_ly ON public.du_an(quan_ly_id);
CREATE INDEX IF NOT EXISTS idx_du_an_don_vi ON public.du_an(don_vi_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an TO authenticated;
GRANT ALL ON public.du_an TO service_role;
ALTER TABLE public.du_an ENABLE ROW LEVEL SECURITY;

-- TABLE: du_an_moc
CREATE TABLE IF NOT EXISTS public.du_an_moc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  du_an_id uuid NOT NULL REFERENCES public.du_an(id) ON DELETE CASCADE,
  ten text NOT NULL,
  mo_ta text,
  thu_tu int NOT NULL DEFAULT 0,
  ngay_bat_dau date,
  ngay_ket_thuc_du_kien date,
  trang_thai cong_viec_trang_thai NOT NULL DEFAULT 'chua_bat_dau',
  tien_do smallint NOT NULL DEFAULT 0 CHECK (tien_do BETWEEN 0 AND 100),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_moc_du_an ON public.du_an_moc(du_an_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_moc TO authenticated;
GRANT ALL ON public.du_an_moc TO service_role;
ALTER TABLE public.du_an_moc ENABLE ROW LEVEL SECURITY;

-- TABLE: du_an_cong_viec
CREATE TABLE IF NOT EXISTS public.du_an_cong_viec (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  du_an_id uuid NOT NULL REFERENCES public.du_an(id) ON DELETE CASCADE,
  moc_id uuid NOT NULL REFERENCES public.du_an_moc(id) ON DELETE CASCADE,
  ten text NOT NULL,
  mo_ta text,
  nguoi_xu_ly_chinh uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ngay_bat_dau date,
  ngay_ket_thuc_du_kien date,
  ngay_hoan_thanh_thuc_te date,
  trang_thai cong_viec_trang_thai NOT NULL DEFAULT 'chua_bat_dau',
  tien_do smallint NOT NULL DEFAULT 0 CHECK (tien_do BETWEEN 0 AND 100),
  ket_qua text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cv_du_an ON public.du_an_cong_viec(du_an_id);
CREATE INDEX IF NOT EXISTS idx_cv_moc ON public.du_an_cong_viec(moc_id);
CREATE INDEX IF NOT EXISTS idx_cv_nguoi_xu_ly ON public.du_an_cong_viec(nguoi_xu_ly_chinh);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_viec TO authenticated;
GRANT ALL ON public.du_an_cong_viec TO service_role;
ALTER TABLE public.du_an_cong_viec ENABLE ROW LEVEL SECURITY;

-- TABLE: du_an_cong_viec_phoi_hop
CREATE TABLE IF NOT EXISTS public.du_an_cong_viec_phoi_hop (
  cong_viec_id uuid NOT NULL REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (cong_viec_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_phoi_hop_user ON public.du_an_cong_viec_phoi_hop(user_id);
GRANT SELECT, INSERT, DELETE ON public.du_an_cong_viec_phoi_hop TO authenticated;
GRANT ALL ON public.du_an_cong_viec_phoi_hop TO service_role;
ALTER TABLE public.du_an_cong_viec_phoi_hop ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.can_access_du_an(_du_an_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.du_an d
      WHERE d.id = _du_an_id
        AND (d.quan_ly_id = _user OR d.nguoi_tao_id = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.du_an_id = _du_an_id
        AND (c.nguoi_xu_ly_chinh = _user OR c.created_by = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec_phoi_hop ph
      JOIN public.du_an_cong_viec c ON c.id = ph.cong_viec_id
      WHERE c.du_an_id = _du_an_id AND ph.user_id = _user
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_du_an(_du_an_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user, 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.du_an d WHERE d.id = _du_an_id AND d.quan_ly_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.can_edit_cong_viec(_cv_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    public.has_role(_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      JOIN public.du_an d ON d.id = c.du_an_id
      WHERE c.id = _cv_id
        AND (d.quan_ly_id = _user OR c.nguoi_xu_ly_chinh = _user OR c.created_by = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec_phoi_hop ph
      WHERE ph.cong_viec_id = _cv_id AND ph.user_id = _user
    );
$$;

REVOKE ALL ON FUNCTION public.can_access_du_an(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_manage_du_an(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_edit_cong_viec(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_access_du_an(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_du_an(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_cong_viec(uuid, uuid) TO authenticated;

-- POLICIES: du_an
CREATE POLICY "du_an_select" ON public.du_an FOR SELECT TO authenticated
  USING (public.can_access_du_an(id, auth.uid()));
CREATE POLICY "du_an_insert" ON public.du_an FOR INSERT TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin'::app_role)
     OR public.has_role(auth.uid(), 'quan_ly_du_an'::app_role))
    AND nguoi_tao_id = auth.uid()
  );
CREATE POLICY "du_an_update" ON public.du_an FOR UPDATE TO authenticated
  USING (public.can_manage_du_an(id, auth.uid()))
  WITH CHECK (public.can_manage_du_an(id, auth.uid()));
CREATE POLICY "du_an_delete" ON public.du_an FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR nguoi_tao_id = auth.uid());

-- POLICIES: du_an_moc
CREATE POLICY "moc_select" ON public.du_an_moc FOR SELECT TO authenticated
  USING (public.can_access_du_an(du_an_id, auth.uid()));
CREATE POLICY "moc_insert" ON public.du_an_moc FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_du_an(du_an_id, auth.uid()));
CREATE POLICY "moc_update" ON public.du_an_moc FOR UPDATE TO authenticated
  USING (public.can_manage_du_an(du_an_id, auth.uid()))
  WITH CHECK (public.can_manage_du_an(du_an_id, auth.uid()));
CREATE POLICY "moc_delete" ON public.du_an_moc FOR DELETE TO authenticated
  USING (public.can_manage_du_an(du_an_id, auth.uid()));

-- POLICIES: du_an_cong_viec
CREATE POLICY "cv_select" ON public.du_an_cong_viec FOR SELECT TO authenticated
  USING (public.can_access_du_an(du_an_id, auth.uid()));
CREATE POLICY "cv_insert" ON public.du_an_cong_viec FOR INSERT TO authenticated
  WITH CHECK (
    public.can_manage_du_an(du_an_id, auth.uid())
    OR public.has_role(auth.uid(), 'to_truong'::app_role)
    OR public.has_role(auth.uid(), 'quan_ly_du_an'::app_role)
  );
CREATE POLICY "cv_update" ON public.du_an_cong_viec FOR UPDATE TO authenticated
  USING (public.can_edit_cong_viec(id, auth.uid()))
  WITH CHECK (public.can_edit_cong_viec(id, auth.uid()));
CREATE POLICY "cv_delete" ON public.du_an_cong_viec FOR DELETE TO authenticated
  USING (public.can_manage_du_an(du_an_id, auth.uid()) OR created_by = auth.uid());

-- POLICIES: phoi_hop
CREATE POLICY "phoi_hop_select" ON public.du_an_cong_viec_phoi_hop FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.id = cong_viec_id AND public.can_access_du_an(c.du_an_id, auth.uid())
    )
  );
CREATE POLICY "phoi_hop_insert" ON public.du_an_cong_viec_phoi_hop FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_cong_viec(cong_viec_id, auth.uid()));
CREATE POLICY "phoi_hop_delete" ON public.du_an_cong_viec_phoi_hop FOR DELETE TO authenticated
  USING (public.can_edit_cong_viec(cong_viec_id, auth.uid()));

-- TRIGGERS
CREATE TRIGGER trg_du_an_updated BEFORE UPDATE ON public.du_an
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_moc_updated BEFORE UPDATE ON public.du_an_moc
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_cv_updated BEFORE UPDATE ON public.du_an_cong_viec
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.notify_cong_viec_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_du_an public.du_an;
  v_actor uuid := auth.uid();
BEGIN
  SELECT * INTO v_du_an FROM public.du_an WHERE id = NEW.du_an_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'cv_moi', 'Công việc mới: ' || NEW.ten,
           'Trong dự án ' || v_du_an.ten,
           '/du-an/' || v_du_an.id::text, 'du_an_cong_viec', NEW.id
    FROM unnest(ARRAY[v_du_an.quan_ly_id, NEW.nguoi_xu_ly_chinh]) u
    WHERE u IS NOT NULL AND u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  ELSIF TG_OP = 'UPDATE' AND (
      NEW.trang_thai IS DISTINCT FROM OLD.trang_thai
      OR NEW.nguoi_xu_ly_chinh IS DISTINCT FROM OLD.nguoi_xu_ly_chinh
      OR NEW.tien_do IS DISTINCT FROM OLD.tien_do
  ) THEN
    INSERT INTO public.notifications (user_id, loai, tieu_de, noi_dung, link, ref_type, ref_id)
    SELECT u, 'cv_cap_nhat', 'Cập nhật công việc: ' || NEW.ten,
           'Trạng thái: ' || NEW.trang_thai::text || ' · Tiến độ: ' || NEW.tien_do || '%',
           '/du-an/' || v_du_an.id::text, 'du_an_cong_viec', NEW.id
    FROM unnest(ARRAY[v_du_an.quan_ly_id, v_du_an.nguoi_tao_id, NEW.nguoi_xu_ly_chinh, NEW.created_by]) u
    WHERE u IS NOT NULL AND u <> COALESCE(v_actor, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_cv_notify
AFTER INSERT OR UPDATE ON public.du_an_cong_viec
FOR EACH ROW EXECUTE FUNCTION public.notify_cong_viec_change();

CREATE TRIGGER trg_du_an_audit AFTER INSERT OR UPDATE OR DELETE ON public.du_an
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER trg_cv_audit AFTER INSERT OR UPDATE OR DELETE ON public.du_an_cong_viec
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
