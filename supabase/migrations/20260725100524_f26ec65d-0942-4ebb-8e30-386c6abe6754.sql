
-- ENUMS
CREATE TYPE public.dot_bao_duong_trang_thai AS ENUM ('nhap','mo','dang_thuc_hien','dong','huy');
CREATE TYPE public.dot_bao_duong_hm_trang_thai AS ENUM ('chua_bat_dau','dang_lam','hoan_thanh','khong_thuc_hien');
CREATE TYPE public.dot_bao_duong_hm_ket_qua AS ENUM ('dat','khong_dat','khac');
CREATE TYPE public.dot_bao_duong_hm_nguon AS ENUM ('kt_khoi_tao','don_vi_bo_sung');

-- 1) DOT
CREATE TABLE public.dot_bao_duong (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ten TEXT NOT NULL,
  nam INT NOT NULL,
  ky SMALLINT NOT NULL CHECK (ky IN (1,2)),
  tu_ngay DATE,
  den_ngay DATE,
  mo_ta TEXT,
  trang_thai public.dot_bao_duong_trang_thai NOT NULL DEFAULT 'nhap',
  nguoi_tao UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong TO authenticated;
GRANT ALL ON public.dot_bao_duong TO service_role;
ALTER TABLE public.dot_bao_duong ENABLE ROW LEVEL SECURITY;
CREATE POLICY dot_bd_read ON public.dot_bao_duong FOR SELECT TO authenticated USING (true);
CREATE POLICY dot_bd_write_kt ON public.dot_bao_duong FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));

-- 2) HANG MUC
CREATE TABLE public.dot_bao_duong_hang_muc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dot_id UUID NOT NULL REFERENCES public.dot_bao_duong(id) ON DELETE CASCADE,
  don_vi_id UUID NOT NULL REFERENCES public.dm_don_vi(id),
  he_thong_id UUID NOT NULL REFERENCES public.dm_he_thong(id),
  nguon public.dot_bao_duong_hm_nguon NOT NULL DEFAULT 'kt_khoi_tao',
  bat_buoc BOOLEAN NOT NULL DEFAULT true,
  ghi_chu_kt TEXT,
  trang_thai public.dot_bao_duong_hm_trang_thai NOT NULL DEFAULT 'chua_bat_dau',
  ket_qua public.dot_bao_duong_hm_ket_qua,
  ton_tai TEXT,
  kien_nghi TEXT,
  nguoi_thuc_hien UUID REFERENCES auth.users(id),
  ngay_hoan_thanh TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dot_id, he_thong_id)
);
CREATE INDEX ix_dbd_hm_dot ON public.dot_bao_duong_hang_muc(dot_id);
CREATE INDEX ix_dbd_hm_dv ON public.dot_bao_duong_hang_muc(don_vi_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong_hang_muc TO authenticated;
GRANT ALL ON public.dot_bao_duong_hang_muc TO service_role;
ALTER TABLE public.dot_bao_duong_hang_muc ENABLE ROW LEVEL SECURITY;
CREATE POLICY dbd_hm_read ON public.dot_bao_duong_hang_muc FOR SELECT TO authenticated USING (true);
CREATE POLICY dbd_hm_write_kt ON public.dot_bao_duong_hang_muc FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt'));
CREATE POLICY dbd_hm_write_dv ON public.dot_bao_duong_hang_muc FOR ALL TO authenticated
  USING (don_vi_id = public.get_user_don_vi_id(auth.uid()))
  WITH CHECK (don_vi_id = public.get_user_don_vi_id(auth.uid()));

-- 3) BIEN BAN LINK
CREATE TABLE public.dot_bao_duong_bien_ban (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hang_muc_id UUID NOT NULL REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE,
  form_submission_id UUID NOT NULL REFERENCES public.form_submission(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hang_muc_id, form_submission_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong_bien_ban TO authenticated;
GRANT ALL ON public.dot_bao_duong_bien_ban TO service_role;
ALTER TABLE public.dot_bao_duong_bien_ban ENABLE ROW LEVEL SECURITY;
CREATE POLICY dbd_bb_all ON public.dot_bao_duong_bien_ban FOR ALL TO authenticated
  USING (true)
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.dot_bao_duong_hang_muc h WHERE h.id = hang_muc_id
      AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
           OR h.don_vi_id = public.get_user_don_vi_id(auth.uid())))
  );

-- 4) TEP
CREATE TABLE public.dot_bao_duong_tep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hang_muc_id UUID NOT NULL REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE,
  duong_dan TEXT NOT NULL,
  ten_goc TEXT,
  loai TEXT,
  nguoi_up UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong_tep TO authenticated;
GRANT ALL ON public.dot_bao_duong_tep TO service_role;
ALTER TABLE public.dot_bao_duong_tep ENABLE ROW LEVEL SECURITY;
CREATE POLICY dbd_tep_all ON public.dot_bao_duong_tep FOR ALL TO authenticated
  USING (true)
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.dot_bao_duong_hang_muc h WHERE h.id = hang_muc_id
      AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
           OR h.don_vi_id = public.get_user_don_vi_id(auth.uid())))
  );

-- 5) SU CO LINK
CREATE TABLE public.dot_bao_duong_su_co (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hang_muc_id UUID NOT NULL REFERENCES public.dot_bao_duong_hang_muc(id) ON DELETE CASCADE,
  su_co_id UUID REFERENCES public.su_co(id) ON DELETE CASCADE,
  hong_hoc_id UUID REFERENCES public.hong_hoc(id) ON DELETE CASCADE,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (su_co_id IS NOT NULL OR hong_hoc_id IS NOT NULL)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_bao_duong_su_co TO authenticated;
GRANT ALL ON public.dot_bao_duong_su_co TO service_role;
ALTER TABLE public.dot_bao_duong_su_co ENABLE ROW LEVEL SECURITY;
CREATE POLICY dbd_sc_all ON public.dot_bao_duong_su_co FOR ALL TO authenticated
  USING (true)
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.dot_bao_duong_hang_muc h WHERE h.id = hang_muc_id
      AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
           OR h.don_vi_id = public.get_user_don_vi_id(auth.uid())))
  );

-- Triggers updated_at
CREATE TRIGGER trg_dbd_upd BEFORE UPDATE ON public.dot_bao_duong
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dbd_hm_upd BEFORE UPDATE ON public.dot_bao_duong_hang_muc
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPCs
CREATE OR REPLACE FUNCTION public.dot_them_hang_muc_hang_loat(
  p_dot_id UUID, p_don_vi_id UUID, p_he_thong_ids UUID[]
) RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count INT := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
          OR p_don_vi_id = public.get_user_don_vi_id(auth.uid())) THEN
    RAISE EXCEPTION 'Không có quyền';
  END IF;
  INSERT INTO public.dot_bao_duong_hang_muc(dot_id, don_vi_id, he_thong_id, nguon)
  SELECT p_dot_id, p_don_vi_id, unnest(p_he_thong_ids),
    CASE WHEN public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'phong_kt')
         THEN 'kt_khoi_tao'::public.dot_bao_duong_hm_nguon
         ELSE 'don_vi_bo_sung'::public.dot_bao_duong_hm_nguon END
  ON CONFLICT (dot_id, he_thong_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END$$;
GRANT EXECUTE ON FUNCTION public.dot_them_hang_muc_hang_loat(UUID,UUID,UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.dot_bao_cao_tong_hop(p_dot_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tong', COUNT(*),
    'hoan_thanh', COUNT(*) FILTER (WHERE trang_thai='hoan_thanh'),
    'dat', COUNT(*) FILTER (WHERE ket_qua='dat'),
    'khong_dat', COUNT(*) FILTER (WHERE ket_qua='khong_dat'),
    'theo_don_vi', (
      SELECT jsonb_agg(row_to_json(x)) FROM (
        SELECT dv.id AS don_vi_id, dv.ten AS don_vi_ten, dv.ma AS don_vi_ma,
               COUNT(h.*) AS tong,
               COUNT(h.*) FILTER (WHERE h.trang_thai='hoan_thanh') AS hoan_thanh,
               COUNT(h.*) FILTER (WHERE h.ket_qua='dat') AS dat,
               COUNT(h.*) FILTER (WHERE h.ket_qua='khong_dat') AS khong_dat
        FROM public.dot_bao_duong_hang_muc h
        JOIN public.dm_don_vi dv ON dv.id = h.don_vi_id
        WHERE h.dot_id = p_dot_id
        GROUP BY dv.id, dv.ten, dv.ma
        ORDER BY dv.ma
      ) x
    ),
    'ton_tai', (
      SELECT jsonb_agg(row_to_json(y)) FROM (
        SELECT h.id, ht.ten AS he_thong_ten, dv.ten AS don_vi_ten, h.ton_tai, h.kien_nghi
        FROM public.dot_bao_duong_hang_muc h
        JOIN public.dm_he_thong ht ON ht.id = h.he_thong_id
        JOIN public.dm_don_vi dv ON dv.id = h.don_vi_id
        WHERE h.dot_id = p_dot_id AND (h.ton_tai IS NOT NULL AND h.ton_tai <> '')
        ORDER BY dv.ma
      ) y
    )
  ) INTO v
  FROM public.dot_bao_duong_hang_muc WHERE dot_id = p_dot_id;
  RETURN v;
END$$;
GRANT EXECUTE ON FUNCTION public.dot_bao_cao_tong_hop(UUID) TO authenticated;
