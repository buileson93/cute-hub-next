-- TASK 55: Đặc tính (tag) đa trị ở cấp Mẫu — độc lập với loại thiết bị.
-- Idempotent; KHÔNG đụng dm_loai_thiet_bi hoặc loai_thiet_bi_id; KHÔNG backfill từ loại.

-- 1) Bảng danh mục đặc tính
CREATE TABLE IF NOT EXISTS public.dm_dac_tinh (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  nhom text NOT NULL DEFAULT 'chuc_nang'
    CHECK (nhom IN ('chuc_nang','bang_tan','khac')),
  mo_ta text,
  thu_tu int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_dac_tinh TO authenticated;
GRANT ALL ON public.dm_dac_tinh TO service_role;

ALTER TABLE public.dm_dac_tinh ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_dac_tinh' AND policyname='dm_dac_tinh_read_active') THEN
    CREATE POLICY dm_dac_tinh_read_active ON public.dm_dac_tinh
      FOR SELECT USING (public.is_active_user(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_dac_tinh' AND policyname='dm_dac_tinh_write_manager') THEN
    CREATE POLICY dm_dac_tinh_write_manager ON public.dm_dac_tinh
      FOR ALL USING (public.can_manage_equipment(auth.uid()))
      WITH CHECK (public.can_manage_equipment(auth.uid()));
  END IF;
END $$;

-- 2) Bảng nối M:N: Mẫu ↔ Đặc tính
CREATE TABLE IF NOT EXISTS public.dm_model_dac_tinh (
  model_id uuid NOT NULL REFERENCES public.dm_model(id) ON DELETE CASCADE,
  dac_tinh_id uuid NOT NULL REFERENCES public.dm_dac_tinh(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (model_id, dac_tinh_id)
);

CREATE INDEX IF NOT EXISTS ix_mdt_dac_tinh
  ON public.dm_model_dac_tinh(dac_tinh_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_model_dac_tinh TO authenticated;
GRANT ALL ON public.dm_model_dac_tinh TO service_role;

ALTER TABLE public.dm_model_dac_tinh ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_model_dac_tinh' AND policyname='dm_model_dac_tinh_read_active') THEN
    CREATE POLICY dm_model_dac_tinh_read_active ON public.dm_model_dac_tinh
      FOR SELECT USING (public.is_active_user(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_model_dac_tinh' AND policyname='dm_model_dac_tinh_write_manager') THEN
    CREATE POLICY dm_model_dac_tinh_write_manager ON public.dm_model_dac_tinh
      FOR ALL USING (public.can_manage_equipment(auth.uid()))
      WITH CHECK (public.can_manage_equipment(auth.uid()));
  END IF;
END $$;

-- 3) View: đặc tính của thiết bị (kế thừa qua Mẫu). security_invoker để tôn trọng RLS.
CREATE OR REPLACE VIEW public.v_thiet_bi_dac_tinh
WITH (security_invoker = true) AS
SELECT tb.id AS thiet_bi_id, mdt.dac_tinh_id
FROM public.thiet_bi tb
JOIN public.dm_model_dac_tinh mdt ON mdt.model_id = tb.model_id;

GRANT SELECT ON public.v_thiet_bi_dac_tinh TO authenticated;
GRANT SELECT ON public.v_thiet_bi_dac_tinh TO service_role;

-- 4) Trigger updated_at cho dm_dac_tinh
DROP TRIGGER IF EXISTS trg_dm_dac_tinh_updated_at ON public.dm_dac_tinh;
CREATE TRIGGER trg_dm_dac_tinh_updated_at
  BEFORE UPDATE ON public.dm_dac_tinh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Seed danh mục — KHÔNG gán tự động cho Mẫu nào.
INSERT INTO public.dm_dac_tinh (ma, ten, nhom, thu_tu) VALUES
  ('THU',        'Thu',              'chuc_nang', 1),
  ('PHAT',       'Phát',             'chuc_nang', 2),
  ('GHI_AM',     'Ghi âm',           'chuc_nang', 3),
  ('DIEU_TAN',   'Điều tần',         'chuc_nang', 4),
  ('KHUECH_DAI', 'Khuếch đại',       'chuc_nang', 5),
  ('DO_LUONG',   'Đo lường',         'chuc_nang', 6),
  ('VHF',        'VHF',              'bang_tan',  1),
  ('HF',         'HF',               'bang_tan',  2),
  ('UHF',        'UHF',              'bang_tan',  3),
  ('CHONG_SET',  'Chống sét',        'khac',      1),
  ('NGUON_DIEN', 'Nguồn điện',       'khac',      2)
ON CONFLICT (ma) DO NOTHING;