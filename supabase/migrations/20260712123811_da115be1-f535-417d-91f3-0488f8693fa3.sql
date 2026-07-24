-- ============ T13: KHO / VẬT TƯ — SỔ CÁI TỒN KHO ============

-- 1) KHO (điểm lưu trữ)
CREATE TABLE public.kho (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_kho text,
  ten text NOT NULL,
  vi_tri_id uuid REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ghi_chu text,
  kich_hoat boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kho TO authenticated;
GRANT ALL ON public.kho TO service_role;
ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;
CREATE POLICY kho_select ON public.kho FOR SELECT
  USING (is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR don_vi_id IS NULL
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  ));
CREATE POLICY kho_write ON public.kho FOR ALL
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 2) VẬT TƯ (danh mục)
CREATE TABLE public.vat_tu (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ma_vat_tu text,
  ten text NOT NULL,
  loai text NOT NULL DEFAULT 'DU_PHONG' CHECK (loai IN ('DU_PHONG','TIEU_HAO')),
  don_vi_tinh text NOT NULL DEFAULT 'cái',
  don_gia numeric NOT NULL DEFAULT 0,
  muc_ton_toi_thieu numeric NOT NULL DEFAULT 0,
  model_id uuid REFERENCES public.dm_model(id) ON DELETE SET NULL,
  nha_cung_cap_id uuid REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  ghi_chu text,
  kich_hoat boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vat_tu TO authenticated;
GRANT ALL ON public.vat_tu TO service_role;
ALTER TABLE public.vat_tu ENABLE ROW LEVEL SECURITY;
CREATE POLICY vat_tu_select ON public.vat_tu FOR SELECT
  USING (is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR don_vi_id IS NULL
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  ));
CREATE POLICY vat_tu_write ON public.vat_tu FOR ALL
  USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- 3) GIAO DỊCH KHO (sổ cái bất biến)
CREATE SEQUENCE IF NOT EXISTS public.kho_giao_dich_seq;
CREATE TABLE public.kho_giao_dich (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  so_ct text,
  nhom_ct uuid,
  vat_tu_id uuid NOT NULL REFERENCES public.vat_tu(id) ON DELETE RESTRICT,
  kho_id uuid NOT NULL REFERENCES public.kho(id) ON DELETE RESTRICT,
  loai text NOT NULL CHECK (loai IN ('NHAP','XUAT','CHUYEN_NHAP','CHUYEN_XUAT','DIEU_CHINH_TANG','DIEU_CHINH_GIAM')),
  so_luong numeric NOT NULL CHECK (so_luong > 0),
  hieu_ung numeric GENERATED ALWAYS AS (
    CASE WHEN loai IN ('NHAP','CHUYEN_NHAP','DIEU_CHINH_TANG') THEN so_luong ELSE -so_luong END
  ) STORED,
  don_gia numeric NOT NULL DEFAULT 0,
  ngay timestamptz NOT NULL DEFAULT now(),
  lien_ket_cong_viec_id uuid REFERENCES public.cong_viec_bao_tri(id) ON DELETE SET NULL,
  lien_ket_su_co_id uuid REFERENCES public.su_co(id) ON DELETE SET NULL,
  lien_ket_hong_hoc_id uuid REFERENCES public.hong_hoc(id) ON DELETE SET NULL,
  don_vi_id uuid,
  nguoi_thuc_hien uuid DEFAULT auth.uid(),
  ghi_chu text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.kho_giao_dich TO authenticated;
GRANT ALL ON public.kho_giao_dich TO service_role;
ALTER TABLE public.kho_giao_dich ENABLE ROW LEVEL SECURITY;
-- Sổ cái: chỉ xem + thêm; KHÔNG có policy UPDATE/DELETE => bất biến
CREATE POLICY kgd_select ON public.kho_giao_dich FOR SELECT
  USING (is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR don_vi_id IS NULL
    OR don_vi_id = get_user_don_vi_id(auth.uid())
  ));
CREATE POLICY kgd_insert ON public.kho_giao_dich FOR INSERT
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE INDEX idx_kgd_vat_tu ON public.kho_giao_dich(vat_tu_id);
CREATE INDEX idx_kgd_kho ON public.kho_giao_dich(kho_id);
CREATE INDEX idx_kgd_nhom ON public.kho_giao_dich(nhom_ct);

-- updated_at triggers
CREATE TRIGGER kho_updated_at BEFORE UPDATE ON public.kho
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER vat_tu_updated_at BEFORE UPDATE ON public.vat_tu
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: sinh số chứng từ + đổ don_vi_id từ kho
CREATE OR REPLACE FUNCTION public.trg_kgd_before_ins()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.so_ct IS NULL OR NEW.so_ct = '' THEN
    NEW.so_ct := 'MV-' || lpad(nextval('public.kho_giao_dich_seq')::text, 6, '0');
  END IF;
  IF NEW.don_vi_id IS NULL THEN
    SELECT k.don_vi_id INTO NEW.don_vi_id FROM public.kho k WHERE k.id = NEW.kho_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER kgd_before_ins BEFORE INSERT ON public.kho_giao_dich
  FOR EACH ROW EXECUTE FUNCTION public.trg_kgd_before_ins();

-- 4) VIEW TỒN KHO (tính từ sổ cái)
CREATE OR REPLACE VIEW public.v_ton_kho
WITH (security_invoker = true) AS
SELECT
  g.vat_tu_id,
  g.kho_id,
  vt.ten AS ten_vat_tu,
  vt.ma_vat_tu,
  vt.loai,
  vt.don_vi_tinh,
  vt.muc_ton_toi_thieu,
  k.ten AS ten_kho,
  g.don_vi_id,
  SUM(g.hieu_ung) AS ton_kho
FROM public.kho_giao_dich g
JOIN public.vat_tu vt ON vt.id = g.vat_tu_id
JOIN public.kho k ON k.id = g.kho_id
GROUP BY g.vat_tu_id, g.kho_id, vt.ten, vt.ma_vat_tu, vt.loai, vt.don_vi_tinh, vt.muc_ton_toi_thieu, k.ten, g.don_vi_id;

CREATE OR REPLACE VIEW public.v_ton_kho_canh_bao
WITH (security_invoker = true) AS
SELECT
  vt.id AS vat_tu_id,
  vt.ten AS ten_vat_tu,
  vt.ma_vat_tu,
  vt.loai,
  vt.don_vi_tinh,
  vt.muc_ton_toi_thieu,
  vt.don_vi_id,
  COALESCE(SUM(g.hieu_ung), 0) AS tong_ton
FROM public.vat_tu vt
LEFT JOIN public.kho_giao_dich g ON g.vat_tu_id = vt.id
WHERE vt.kich_hoat = true
GROUP BY vt.id, vt.ten, vt.ma_vat_tu, vt.loai, vt.don_vi_tinh, vt.muc_ton_toi_thieu, vt.don_vi_id
HAVING COALESCE(SUM(g.hieu_ung), 0) < vt.muc_ton_toi_thieu;

GRANT SELECT ON public.v_ton_kho TO authenticated;
GRANT SELECT ON public.v_ton_kho_canh_bao TO authenticated;

-- 5) HÀM NGHIỆP VỤ (SECURITY DEFINER, kiểm tra quyền)

-- Tồn hiện tại của 1 vật tư tại 1 kho
CREATE OR REPLACE FUNCTION public.kho_ton_hien_tai(_vat_tu_id uuid, _kho_id uuid)
RETURNS numeric LANGUAGE sql STABLE SET search_path TO 'public' AS $$
  SELECT COALESCE(SUM(hieu_ung), 0) FROM public.kho_giao_dich
  WHERE vat_tu_id = _vat_tu_id AND kho_id = _kho_id;
$$;

-- NHẬP
CREATE OR REPLACE FUNCTION public.kho_nhap(
  _vat_tu_id uuid, _kho_id uuid, _so_luong numeric,
  _don_gia numeric DEFAULT 0, _ghi_chu text DEFAULT NULL,
  _cong_viec_id uuid DEFAULT NULL, _su_co_id uuid DEFAULT NULL, _hong_hoc_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền nhập kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, don_gia, ghi_chu,
    lien_ket_cong_viec_id, lien_ket_su_co_id, lien_ket_hong_hoc_id)
  VALUES (_vat_tu_id, _kho_id, 'NHAP', _so_luong, _don_gia, _ghi_chu,
    _cong_viec_id, _su_co_id, _hong_hoc_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- XUẤT (chặn âm/vượt tồn trừ khi override)
CREATE OR REPLACE FUNCTION public.kho_xuat(
  _vat_tu_id uuid, _kho_id uuid, _so_luong numeric,
  _don_gia numeric DEFAULT 0, _ghi_chu text DEFAULT NULL,
  _cong_viec_id uuid DEFAULT NULL, _su_co_id uuid DEFAULT NULL, _hong_hoc_id uuid DEFAULT NULL,
  _cho_phep_am boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _id uuid; _ton numeric;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền xuất kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_id);
  IF _ton < _so_luong AND NOT _cho_phep_am THEN
    RAISE EXCEPTION 'Không đủ tồn kho: hiện có %, cần xuất %', _ton, _so_luong;
  END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, don_gia, ghi_chu,
    lien_ket_cong_viec_id, lien_ket_su_co_id, lien_ket_hong_hoc_id)
  VALUES (_vat_tu_id, _kho_id, 'XUAT', _so_luong, _don_gia, _ghi_chu,
    _cong_viec_id, _su_co_id, _hong_hoc_id)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

-- CHUYỂN KHO (cân bằng hai kho)
CREATE OR REPLACE FUNCTION public.kho_chuyen(
  _vat_tu_id uuid, _kho_nguon_id uuid, _kho_dich_id uuid, _so_luong numeric,
  _ghi_chu text DEFAULT NULL, _cho_phep_am boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _nhom uuid := gen_random_uuid(); _ton numeric;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền chuyển kho'; END IF;
  IF _so_luong <= 0 THEN RAISE EXCEPTION 'Số lượng phải > 0'; END IF;
  IF _kho_nguon_id = _kho_dich_id THEN RAISE EXCEPTION 'Kho nguồn và kho đích phải khác nhau'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_nguon_id);
  IF _ton < _so_luong AND NOT _cho_phep_am THEN
    RAISE EXCEPTION 'Không đủ tồn kho nguồn: hiện có %, cần chuyển %', _ton, _so_luong;
  END IF;
  INSERT INTO public.kho_giao_dich(nhom_ct, vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_nhom, _vat_tu_id, _kho_nguon_id, 'CHUYEN_XUAT', _so_luong, _ghi_chu);
  INSERT INTO public.kho_giao_dich(nhom_ct, vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_nhom, _vat_tu_id, _kho_dich_id, 'CHUYEN_NHAP', _so_luong, _ghi_chu);
  RETURN _nhom;
END;
$$;

-- KIỂM KÊ (điều chỉnh theo số thực tế)
CREATE OR REPLACE FUNCTION public.kho_kiem_ke(
  _vat_tu_id uuid, _kho_id uuid, _so_luong_thuc_te numeric, _ghi_chu text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _id uuid; _ton numeric; _delta numeric;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền kiểm kê kho'; END IF;
  IF _so_luong_thuc_te < 0 THEN RAISE EXCEPTION 'Số lượng thực tế không âm'; END IF;
  _ton := public.kho_ton_hien_tai(_vat_tu_id, _kho_id);
  _delta := _so_luong_thuc_te - _ton;
  IF _delta = 0 THEN RETURN NULL; END IF;
  INSERT INTO public.kho_giao_dich(vat_tu_id, kho_id, loai, so_luong, ghi_chu)
  VALUES (_vat_tu_id, _kho_id,
    CASE WHEN _delta > 0 THEN 'DIEU_CHINH_TANG' ELSE 'DIEU_CHINH_GIAM' END,
    abs(_delta), COALESCE(_ghi_chu, 'Kiểm kê: điều chỉnh từ ' || _ton || ' → ' || _so_luong_thuc_te))
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.kho_ton_hien_tai(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kho_nhap(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kho_xuat(uuid, uuid, numeric, numeric, text, uuid, uuid, uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kho_chuyen(uuid, uuid, uuid, numeric, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.kho_kiem_ke(uuid, uuid, numeric, text) TO authenticated;