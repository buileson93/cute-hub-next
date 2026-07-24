
-- ============ Helper: check user active ============
CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND active = true)
$$;

CREATE OR REPLACE FUNCTION public.can_manage_equipment(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role)
      OR public.has_role(_user_id, 'phong_kt'::app_role)
$$;

-- ============ LOOKUP TABLES ============
-- Generic shape: id UUID, ma TEXT UNIQUE, ten TEXT, mo_ta TEXT, thu_tu INT, active BOOL
-- All lookups share the same RLS pattern (active users read, admin+phong_kt write).

DO $$
DECLARE
  t text;
  lookups text[] := ARRAY[
    'dm_loai_thiet_bi','dm_trang_thai_thiet_bi','dm_he_thong','dm_nhom_he_thong',
    'dm_don_vi','dm_loai_giay_phep','dm_noi_cap'
  ];
BEGIN
  FOREACH t IN ARRAY lookups LOOP
    EXECUTE format($f$
      CREATE TABLE public.%I (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ma text NOT NULL UNIQUE,
        ten text NOT NULL,
        mo_ta text,
        thu_tu int NOT NULL DEFAULT 0,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated;
      GRANT ALL ON public.%I TO service_role;
      ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "lookup_read_active" ON public.%I FOR SELECT TO authenticated
        USING (public.is_active_user(auth.uid()));
      CREATE POLICY "lookup_write_manager" ON public.%I FOR ALL TO authenticated
        USING (public.can_manage_equipment(auth.uid()))
        WITH CHECK (public.can_manage_equipment(auth.uid()));
      CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    $f$, t,t,t,t,t,t,t,t);
  END LOOP;
END $$;

-- ============ THIET_BI ============
CREATE TABLE public.thiet_bi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_thiet_bi text NOT NULL UNIQUE,
  ten_thiet_bi text NOT NULL,
  loai_thiet_bi_id uuid REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL,
  ma_serial text,
  model text,
  nha_san_xuat text,
  ngay_mua date,
  he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  nhom_he_thong_id uuid REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL,
  nha_cung_cap text,
  han_bao_hanh date,
  trang_thai_id uuid REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL,
  don_vi_quan_ly_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  vi_tri text,
  ghi_chu text,
  file_tai_lieu text,
  hinh_anh text,
  qr_code text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi TO authenticated;
GRANT ALL ON public.thiet_bi TO service_role;
ALTER TABLE public.thiet_bi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "thiet_bi_read_active" ON public.thiet_bi FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "thiet_bi_write_manager" ON public.thiet_bi FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_thiet_bi_updated_at BEFORE UPDATE ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_thiet_bi_loai ON public.thiet_bi(loai_thiet_bi_id);
CREATE INDEX idx_thiet_bi_he_thong ON public.thiet_bi(he_thong_id);
CREATE INDEX idx_thiet_bi_nhom ON public.thiet_bi(nhom_he_thong_id);
CREATE INDEX idx_thiet_bi_don_vi ON public.thiet_bi(don_vi_quan_ly_id);
CREATE INDEX idx_thiet_bi_trang_thai ON public.thiet_bi(trang_thai_id);
CREATE INDEX idx_thiet_bi_ma_search ON public.thiet_bi USING gin (to_tsvector('simple', coalesce(ma_thiet_bi,'') || ' ' || coalesce(ten_thiet_bi,'') || ' ' || coalesce(ma_serial,'') || ' ' || coalesce(model,'')));

-- ============ GIAY_PHEP ============
CREATE TABLE public.giay_phep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_giay_phep text NOT NULL UNIQUE,
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  loai_giay_phep_id uuid REFERENCES public.dm_loai_giay_phep(id) ON DELETE SET NULL,
  so_giay_phep text,
  ngay_cap date,
  ngay_het_han date,
  noi_cap_id uuid REFERENCES public.dm_noi_cap(id) ON DELETE SET NULL,
  file_giay_phep text,
  ghi_chu text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.giay_phep TO authenticated;
GRANT ALL ON public.giay_phep TO service_role;
ALTER TABLE public.giay_phep ENABLE ROW LEVEL SECURITY;

CREATE POLICY "giay_phep_read_active" ON public.giay_phep FOR SELECT TO authenticated
  USING (public.is_active_user(auth.uid()));
CREATE POLICY "giay_phep_write_manager" ON public.giay_phep FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_giay_phep_updated_at BEFORE UPDATE ON public.giay_phep
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_giay_phep_thiet_bi ON public.giay_phep(thiet_bi_id);
CREATE INDEX idx_giay_phep_loai ON public.giay_phep(loai_giay_phep_id);
CREATE INDEX idx_giay_phep_noi_cap ON public.giay_phep(noi_cap_id);
CREATE INDEX idx_giay_phep_het_han ON public.giay_phep(ngay_het_han);
