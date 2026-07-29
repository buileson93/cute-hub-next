CREATE TYPE public.cong_van_loai AS ENUM ('den','di','to_trinh','bao_cao','quyet_dinh','khac');
CREATE TYPE public.cong_van_trang_thai AS ENUM ('moi','dang_xu_ly','cho_duyet','da_duyet','da_phat_hanh','hoan_tat','huy');
CREATE TYPE public.cong_van_lien_ket_loai AS ENUM ('tra_loi','can_cu','lien_quan','dinh_kem');

CREATE TABLE public.du_an_cong_van (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  du_an_id uuid NOT NULL REFERENCES public.du_an(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.du_an_cong_van(id) ON DELETE SET NULL,
  so_cong_van text NOT NULL,
  loai public.cong_van_loai NOT NULL DEFAULT 'den',
  trich_yeu text,
  co_quan_ban_hanh text,
  co_quan_nhan text,
  ngay_ban_hanh date,
  ngay_tiep_nhan date,
  han_phuc_dap date,
  trang_thai public.cong_van_trang_thai NOT NULL DEFAULT 'moi',
  can_cu_text text,
  ghi_chu text,
  nguoi_tao_id uuid NOT NULL DEFAULT auth.uid(),
  attrs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dacv_du_an ON public.du_an_cong_van(du_an_id);
CREATE INDEX idx_dacv_parent ON public.du_an_cong_van(parent_id);
CREATE INDEX idx_dacv_ngay ON public.du_an_cong_van(ngay_ban_hanh);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_van TO authenticated;
GRANT ALL ON public.du_an_cong_van TO service_role;
ALTER TABLE public.du_an_cong_van ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dacv_select" ON public.du_an_cong_van FOR SELECT TO authenticated
  USING (public.can_access_du_an(du_an_id, public.current_uid()));
CREATE POLICY "dacv_write" ON public.du_an_cong_van FOR ALL TO authenticated
  USING (public.can_manage_du_an(du_an_id, public.current_uid()))
  WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));
CREATE TRIGGER trg_dacv_updated BEFORE UPDATE ON public.du_an_cong_van
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.du_an_cong_van_lien_ket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tu_id uuid NOT NULL REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE,
  den_id uuid NOT NULL REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE,
  loai public.cong_van_lien_ket_loai NOT NULL DEFAULT 'tra_loi',
  ghi_chu text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dacvlk_khac_nhau CHECK (tu_id <> den_id),
  CONSTRAINT dacvlk_unique UNIQUE (tu_id, den_id, loai)
);
CREATE INDEX idx_dacvlk_tu ON public.du_an_cong_van_lien_ket(tu_id);
CREATE INDEX idx_dacvlk_den ON public.du_an_cong_van_lien_ket(den_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_van_lien_ket TO authenticated;
GRANT ALL ON public.du_an_cong_van_lien_ket TO service_role;
ALTER TABLE public.du_an_cong_van_lien_ket ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dacvlk_select" ON public.du_an_cong_van_lien_ket FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_lien_ket.tu_id
      AND public.can_access_du_an(cv.du_an_id, public.current_uid())));
CREATE POLICY "dacvlk_write" ON public.du_an_cong_van_lien_ket FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_lien_ket.tu_id
      AND public.can_manage_du_an(cv.du_an_id, public.current_uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_lien_ket.tu_id
      AND public.can_manage_du_an(cv.du_an_id, public.current_uid())));
CREATE TRIGGER trg_dacvlk_updated BEFORE UPDATE ON public.du_an_cong_van_lien_ket
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.du_an_cong_van_tep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cong_van_id uuid NOT NULL REFERENCES public.du_an_cong_van(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'tai-lieu',
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  kich_thuoc bigint,
  mo_ta text,
  uploaded_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dacvt_cong_van ON public.du_an_cong_van_tep(cong_van_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.du_an_cong_van_tep TO authenticated;
GRANT ALL ON public.du_an_cong_van_tep TO service_role;
ALTER TABLE public.du_an_cong_van_tep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dacvt_select" ON public.du_an_cong_van_tep FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_tep.cong_van_id
      AND public.can_access_du_an(cv.du_an_id, public.current_uid())));
CREATE POLICY "dacvt_write" ON public.du_an_cong_van_tep FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_tep.cong_van_id
      AND public.can_manage_du_an(cv.du_an_id, public.current_uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.du_an_cong_van cv
    WHERE cv.id = du_an_cong_van_tep.cong_van_id
      AND public.can_manage_du_an(cv.du_an_id, public.current_uid())));
CREATE TRIGGER trg_dacvt_updated BEFORE UPDATE ON public.du_an_cong_van_tep
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();