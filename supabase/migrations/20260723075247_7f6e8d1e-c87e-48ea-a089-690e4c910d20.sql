
-- ============================================================================
-- N5 — thong_bao, thong_bao_cau_hinh, thong_bao_email_queue
-- ============================================================================

-- 1) thong_bao
CREATE TABLE IF NOT EXISTS public.thong_bao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loai TEXT NOT NULL CHECK (loai IN ('bao_hanh','giay_phep','chung_chi_kd','chung_chi_hc','he_thong','khac')),
  doi_tuong_bang TEXT NOT NULL,
  doi_tuong_ref UUID NOT NULL,
  don_vi_id UUID NULL REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  muc_do TEXT NOT NULL CHECK (muc_do IN ('info','warning','critical','overdue')),
  nguong INT NULL,
  tieu_de TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  den_han_at DATE NOT NULL,
  khoa_chong_trung TEXT NOT NULL UNIQUE,
  da_doc BOOLEAN NOT NULL DEFAULT false,
  da_doc_at TIMESTAMPTZ NULL,
  da_doc_boi UUID NULL,
  kenh JSONB NOT NULL DEFAULT '{"in_app":true,"email":false}'::jsonb,
  email_queued BOOLEAN NOT NULL DEFAULT false,
  nguoi_nhan UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.thong_bao TO authenticated;
GRANT ALL ON public.thong_bao TO service_role;

ALTER TABLE public.thong_bao ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS thong_bao_nguoi_nhan_idx
  ON public.thong_bao (nguoi_nhan, da_doc, created_at DESC);
CREATE INDEX IF NOT EXISTS thong_bao_don_vi_idx
  ON public.thong_bao (don_vi_id, da_doc);
CREATE INDEX IF NOT EXISTS thong_bao_den_han_idx
  ON public.thong_bao (den_han_at);

CREATE POLICY thong_bao_select ON public.thong_bao
  FOR SELECT TO authenticated
  USING (
    nguoi_nhan = auth.uid()
    OR (nguoi_nhan IS NULL AND don_vi_id IN (
      SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid()
    ))
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY thong_bao_update_read ON public.thong_bao
  FOR UPDATE TO authenticated
  USING (
    nguoi_nhan = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (nguoi_nhan IS NULL AND don_vi_id IN (
      SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid()
    ))
  )
  WITH CHECK (
    nguoi_nhan = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR (nguoi_nhan IS NULL AND don_vi_id IN (
      SELECT don_vi_id FROM public.user_scope WHERE user_id = auth.uid()
    ))
  );

CREATE TRIGGER thong_bao_updated_at
  BEFORE UPDATE ON public.thong_bao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) thong_bao_cau_hinh
CREATE TABLE IF NOT EXISTS public.thong_bao_cau_hinh (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('global','don_vi','loai')),
  don_vi_id UUID NULL REFERENCES public.dm_don_vi(id) ON DELETE CASCADE,
  loai TEXT NULL,
  nguong INT[] NOT NULL DEFAULT ARRAY[30,15,7],
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS thong_bao_cau_hinh_uniq
  ON public.thong_bao_cau_hinh (scope, COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(loai, ''));

GRANT SELECT ON public.thong_bao_cau_hinh TO authenticated;
GRANT ALL ON public.thong_bao_cau_hinh TO service_role;

ALTER TABLE public.thong_bao_cau_hinh ENABLE ROW LEVEL SECURITY;

CREATE POLICY thong_bao_cau_hinh_read ON public.thong_bao_cau_hinh
  FOR SELECT TO authenticated USING (true);

CREATE POLICY thong_bao_cau_hinh_write ON public.thong_bao_cau_hinh
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER thong_bao_cau_hinh_updated_at
  BEFORE UPDATE ON public.thong_bao_cau_hinh
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.thong_bao_cau_hinh (scope, nguong, in_app_enabled, email_enabled)
VALUES ('global', ARRAY[30,15,7], true, false)
ON CONFLICT DO NOTHING;

-- 3) thong_bao_email_queue
CREATE TABLE IF NOT EXISTS public.thong_bao_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thong_bao_id UUID NOT NULL REFERENCES public.thong_bao(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'pending' CHECK (trang_thai IN ('pending','sent','failed','skipped')),
  attempt INT NOT NULL DEFAULT 0,
  last_error TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS thong_bao_email_queue_status_idx
  ON public.thong_bao_email_queue (trang_thai, created_at);

GRANT SELECT ON public.thong_bao_email_queue TO authenticated;
GRANT ALL ON public.thong_bao_email_queue TO service_role;

ALTER TABLE public.thong_bao_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY thong_bao_email_queue_admin ON public.thong_bao_email_queue
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
