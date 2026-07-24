
-- Add nhom_he_thong_id to dm_he_thong
ALTER TABLE public.dm_he_thong
  ADD COLUMN IF NOT EXISTS nhom_he_thong_id uuid REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dm_he_thong_nhom ON public.dm_he_thong(nhom_he_thong_id);

-- New lookup tables via loop
DO $$
DECLARE
  t text;
  lookups text[] := ARRAY['dm_nha_san_xuat','dm_nha_cung_cap','dm_vi_tri'];
BEGIN
  FOREACH t IN ARRAY lookups LOOP
    EXECUTE format($f$
      CREATE TABLE IF NOT EXISTS public.%I (
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
    $f$, t,t,t,t);
    EXECUTE format('DROP POLICY IF EXISTS "lookup_read_active" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "lookup_write_manager" ON public.%I', t);
    EXECUTE format($p$CREATE POLICY "lookup_read_active" ON public.%I FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()))$p$, t);
    EXECUTE format($p$CREATE POLICY "lookup_write_manager" ON public.%I FOR ALL TO authenticated USING (public.can_manage_equipment(auth.uid())) WITH CHECK (public.can_manage_equipment(auth.uid()))$p$, t);
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- Add FK columns to thiet_bi
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS nha_san_xuat_id uuid REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS nha_cung_cap_id uuid REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vi_tri_id      uuid REFERENCES public.dm_vi_tri(id)      ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_thiet_bi_nsx ON public.thiet_bi(nha_san_xuat_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_ncc ON public.thiet_bi(nha_cung_cap_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_vitri ON public.thiet_bi(vi_tri_id);
