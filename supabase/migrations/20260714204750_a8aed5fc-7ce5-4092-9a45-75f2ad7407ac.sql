-- 1) Bảng dinh_nghia_truong
CREATE TABLE IF NOT EXISTS public.dinh_nghia_truong (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  nhan text NOT NULL,
  loai text NOT NULL CHECK (loai IN ('text','so','ngay','chon','checkbox')),
  bat_buoc boolean NOT NULL DEFAULT false,
  lua_chon jsonb,
  ap_dung_cho text NOT NULL,
  mo_ta text,
  min_so numeric,
  max_so numeric,
  thu_tu integer NOT NULL DEFAULT 0,
  kich_hoat boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (ap_dung_cho, key),
  CONSTRAINT dnt_key_format CHECK (key ~ '^[a-z][a-z0-9_]*$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dinh_nghia_truong TO authenticated;
GRANT ALL ON public.dinh_nghia_truong TO service_role;

ALTER TABLE public.dinh_nghia_truong ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dnt_read_authenticated" ON public.dinh_nghia_truong
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "dnt_write_admin" ON public.dinh_nghia_truong
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_dnt_apdungcho ON public.dinh_nghia_truong (ap_dung_cho, thu_tu);

CREATE TRIGGER trg_dnt_updated_at
  BEFORE UPDATE ON public.dinh_nghia_truong
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Cột attrs JSONB cho các bảng thực thể chính
ALTER TABLE public.thiet_bi           ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.dm_he_thong        ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.su_co              ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.bao_tri            ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.giay_phep_khai_thac ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.du_an              ADD COLUMN IF NOT EXISTS attrs jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) GIN index để lọc/tìm nhanh theo attrs (jsonb_path_ops = compact + nhanh cho @>)
CREATE INDEX IF NOT EXISTS idx_thiet_bi_attrs_gin    ON public.thiet_bi           USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_dmht_attrs_gin        ON public.dm_he_thong        USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_suco_attrs_gin        ON public.su_co              USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_baotri_attrs_gin      ON public.bao_tri            USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_gpkt_attrs_gin        ON public.giay_phep_khai_thac USING gin (attrs jsonb_path_ops);
CREATE INDEX IF NOT EXISTS idx_duan_attrs_gin        ON public.du_an              USING gin (attrs jsonb_path_ops);