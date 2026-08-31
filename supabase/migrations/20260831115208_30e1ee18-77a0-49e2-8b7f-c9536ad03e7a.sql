-- 1) Thành viên dự án
CREATE TABLE IF NOT EXISTS public.du_an_thanh_vien (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  du_an_id uuid NOT NULL REFERENCES public.du_an(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vai_tro text NOT NULL DEFAULT 'thanh_vien' CHECK (vai_tro IN ('chu_tri','thanh_vien','theo_doi')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (du_an_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_datv_du_an ON public.du_an_thanh_vien(du_an_id);
CREATE INDEX IF NOT EXISTS idx_datv_user ON public.du_an_thanh_vien(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_thanh_vien TO authenticated;
GRANT ALL ON public.du_an_thanh_vien TO service_role;
ALTER TABLE public.du_an_thanh_vien ENABLE ROW LEVEL SECURITY;

-- 2) Mở rộng helper: thành viên dự án cũng được coi là có quyền truy cập / chủ trì được quản lý
CREATE OR REPLACE FUNCTION public.can_access_du_an(_du_an_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT
    public.has_role(_user, 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.du_an d
      WHERE d.id = _du_an_id AND (d.quan_ly_id = _user OR d.nguoi_tao_id = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_thanh_vien tv
      WHERE tv.du_an_id = _du_an_id AND tv.user_id = _user
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.du_an_id = _du_an_id AND (c.nguoi_xu_ly_chinh = _user OR c.created_by = _user)
    )
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec_phoi_hop ph
      JOIN public.du_an_cong_viec c ON c.id = ph.cong_viec_id
      WHERE c.du_an_id = _du_an_id AND ph.user_id = _user
    );
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_du_an(_du_an_id uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  SELECT public.has_role(_user, 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM public.du_an d WHERE d.id = _du_an_id AND d.quan_ly_id = _user)
    OR EXISTS (
      SELECT 1 FROM public.du_an_thanh_vien tv
      WHERE tv.du_an_id = _du_an_id AND tv.user_id = _user AND tv.vai_tro = 'chu_tri'
    );
$function$;

CREATE POLICY "du_an_thanh_vien_select" ON public.du_an_thanh_vien
  FOR SELECT TO authenticated
  USING (public.can_access_du_an(du_an_id, auth.uid()));
CREATE POLICY "du_an_thanh_vien_write" ON public.du_an_thanh_vien
  FOR ALL TO authenticated
  USING (public.can_manage_du_an(du_an_id, auth.uid()))
  WITH CHECK (public.can_manage_du_an(du_an_id, auth.uid()));

-- 3) Người tạo dự án tự động là chủ trì
CREATE OR REPLACE FUNCTION public.fn_du_an_seed_chu_tri()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.du_an_thanh_vien (du_an_id, user_id, vai_tro)
  VALUES (NEW.id, COALESCE(NEW.quan_ly_id, NEW.nguoi_tao_id), 'chu_tri')
  ON CONFLICT (du_an_id, user_id) DO NOTHING;
  IF NEW.nguoi_tao_id IS NOT NULL AND NEW.nguoi_tao_id IS DISTINCT FROM NEW.quan_ly_id THEN
    INSERT INTO public.du_an_thanh_vien (du_an_id, user_id, vai_tro)
    VALUES (NEW.id, NEW.nguoi_tao_id, 'chu_tri')
    ON CONFLICT (du_an_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.fn_du_an_seed_chu_tri() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_du_an_seed_chu_tri ON public.du_an;
CREATE TRIGGER trg_du_an_seed_chu_tri
AFTER INSERT ON public.du_an
FOR EACH ROW EXECUTE FUNCTION public.fn_du_an_seed_chu_tri();

-- Backfill thành viên chủ trì cho dự án đã có
INSERT INTO public.du_an_thanh_vien (du_an_id, user_id, vai_tro)
SELECT d.id, d.quan_ly_id, 'chu_tri' FROM public.du_an d
WHERE d.quan_ly_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.quan_ly_id)
ON CONFLICT (du_an_id, user_id) DO NOTHING;
INSERT INTO public.du_an_thanh_vien (du_an_id, user_id, vai_tro)
SELECT d.id, d.nguoi_tao_id, 'chu_tri' FROM public.du_an d
WHERE d.nguoi_tao_id IS NOT NULL AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.nguoi_tao_id)
ON CONFLICT (du_an_id, user_id) DO NOTHING;

-- 4) Checklist công việc
CREATE TABLE IF NOT EXISTS public.du_an_cong_viec_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cong_viec_id uuid NOT NULL REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE,
  noi_dung text NOT NULL CHECK (length(btrim(noi_dung)) > 0),
  hoan_thanh boolean NOT NULL DEFAULT false,
  thu_tu integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dacvcl_cv ON public.du_an_cong_viec_checklist(cong_viec_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_viec_checklist TO authenticated;
GRANT ALL ON public.du_an_cong_viec_checklist TO service_role;
ALTER TABLE public.du_an_cong_viec_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dacv_checklist_select" ON public.du_an_cong_viec_checklist
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.du_an_cong_viec c
    WHERE c.id = cong_viec_id AND public.can_access_du_an(c.du_an_id, auth.uid())
  ));
CREATE POLICY "dacv_checklist_write" ON public.du_an_cong_viec_checklist
  FOR ALL TO authenticated
  USING (public.can_edit_cong_viec(cong_viec_id, auth.uid()))
  WITH CHECK (public.can_edit_cong_viec(cong_viec_id, auth.uid()));

-- 5) Bình luận công việc
CREATE TABLE IF NOT EXISTS public.du_an_cong_viec_binh_luan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cong_viec_id uuid NOT NULL REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  noi_dung text NOT NULL CHECK (length(btrim(noi_dung)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dacvbl_cv ON public.du_an_cong_viec_binh_luan(cong_viec_id, created_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_viec_binh_luan TO authenticated;
GRANT ALL ON public.du_an_cong_viec_binh_luan TO service_role;
ALTER TABLE public.du_an_cong_viec_binh_luan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dacv_binh_luan_select" ON public.du_an_cong_viec_binh_luan
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.du_an_cong_viec c
    WHERE c.id = cong_viec_id AND public.can_access_du_an(c.du_an_id, auth.uid())
  ));
CREATE POLICY "dacv_binh_luan_insert" ON public.du_an_cong_viec_binh_luan
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.id = cong_viec_id AND public.can_access_du_an(c.du_an_id, auth.uid())
    )
  );
CREATE POLICY "dacv_binh_luan_update_own" ON public.du_an_cong_viec_binh_luan
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "dacv_binh_luan_delete" ON public.du_an_cong_viec_binh_luan
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.du_an_cong_viec c
      WHERE c.id = cong_viec_id AND public.can_manage_du_an(c.du_an_id, auth.uid())
    )
  );

-- 6) updated_at triggers
CREATE TRIGGER trg_datv_updated BEFORE UPDATE ON public.du_an_thanh_vien
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dacvcl_updated BEFORE UPDATE ON public.du_an_cong_viec_checklist
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dacvbl_updated BEFORE UPDATE ON public.du_an_cong_viec_binh_luan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();