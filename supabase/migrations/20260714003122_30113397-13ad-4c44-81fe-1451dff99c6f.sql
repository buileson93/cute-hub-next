-- ========== Cờ linh kiện trên thiết bị ==========
ALTER TABLE public.thiet_bi
  ADD COLUMN IF NOT EXISTS la_linh_kien boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.thiet_bi.la_linh_kien IS
  'true = đơn vị vật lý này là linh kiện, được gán vào khe linh kiện của một thiết bị cha';

-- ========== Bảng khe linh kiện (đứng yên) ==========
CREATE TABLE IF NOT EXISTS public.thiet_bi_khe_linh_kien (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thiet_bi_id           uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  ma_khe                text NOT NULL,
  ten                   text NOT NULL,
  loai_thiet_bi_yeu_cau uuid REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL,
  khe_cha               uuid REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE,
  bat_buoc              boolean NOT NULL DEFAULT true,
  thu_tu                integer,
  mo_ta                 text,
  trang_thai            text NOT NULL DEFAULT 'hoat_dong'
                          CHECK (trang_thai IN ('hoat_dong','ngung')),
  hieu_luc_tu           date,
  hieu_luc_den          date,
  don_vi_id_snapshot    uuid,
  created_by            uuid DEFAULT auth.uid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thiet_bi_id, ma_khe),
  CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den >= hieu_luc_tu)
);
CREATE INDEX IF NOT EXISTS idx_khe_lk_thiet_bi ON public.thiet_bi_khe_linh_kien(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_khe_lk_cha ON public.thiet_bi_khe_linh_kien(khe_cha);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_khe_linh_kien TO authenticated;
GRANT ALL ON public.thiet_bi_khe_linh_kien TO service_role;
ALTER TABLE public.thiet_bi_khe_linh_kien ENABLE ROW LEVEL SECURITY;

CREATE POLICY "khe_lk_select" ON public.thiet_bi_khe_linh_kien
  FOR SELECT USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR can_view_thiet_bi(thiet_bi_id, auth.uid())
    )
  );
CREATE POLICY "khe_lk_write_manager" ON public.thiet_bi_khe_linh_kien
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

CREATE TRIGGER trg_khe_lk_updated_at BEFORE UPDATE ON public.thiet_bi_khe_linh_kien
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ========== Bảng gán linh kiện theo thời gian ==========
CREATE TABLE IF NOT EXISTS public.gan_linh_kien (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  khe_id             uuid NOT NULL REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE,
  linh_kien_id       uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE RESTRICT,
  tu_ngay            timestamptz NOT NULL DEFAULT now(),
  den_ngay           timestamptz,
  ly_do              text NOT NULL DEFAULT 'lắp mới'
                       CHECK (ly_do IN ('lắp mới','thay do hỏng','điều chuyển','tháo')),
  hong_hoc_id        uuid REFERENCES public.hong_hoc(id) ON DELETE SET NULL,
  nguoi_thuc_hien    uuid,
  ghi_chu            text,
  don_vi_id_snapshot uuid,
  created_by         uuid DEFAULT auth.uid(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (den_ngay IS NULL OR den_ngay >= tu_ngay)
);
CREATE INDEX IF NOT EXISTS idx_glk_khe ON public.gan_linh_kien(khe_id);
CREATE INDEX IF NOT EXISTS idx_glk_linh_kien ON public.gan_linh_kien(linh_kien_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_glk_khe_active
  ON public.gan_linh_kien(khe_id) WHERE den_ngay IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_glk_linh_kien_active
  ON public.gan_linh_kien(linh_kien_id) WHERE den_ngay IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gan_linh_kien TO authenticated;
GRANT ALL ON public.gan_linh_kien TO service_role;
ALTER TABLE public.gan_linh_kien ENABLE ROW LEVEL SECURITY;

CREATE POLICY "glk_select" ON public.gan_linh_kien
  FOR SELECT USING (
    is_active_user(auth.uid()) AND (
      can_manage_equipment(auth.uid())
      OR can_view_thiet_bi(linh_kien_id, auth.uid())
      OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
    )
  );
CREATE POLICY "glk_write_manager" ON public.gan_linh_kien
  FOR ALL USING (can_manage_equipment(auth.uid()))
  WITH CHECK (can_manage_equipment(auth.uid()));

-- ========== Trigger validate BEFORE trên gán linh kiện ==========
CREATE OR REPLACE FUNCTION public.trg_glk_before()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_khe     public.thiet_bi_khe_linh_kien%ROWTYPE;
  v_loai    uuid;
  v_is_lk   boolean;
  v_don_vi  uuid;
BEGIN
  SELECT * INTO v_khe FROM public.thiet_bi_khe_linh_kien WHERE id = NEW.khe_id;

  IF TG_OP = 'INSERT' AND NEW.den_ngay IS NULL AND v_khe.trang_thai = 'ngung' THEN
    RAISE EXCEPTION 'Khe linh kiện đã ngừng, không thể gán linh kiện';
  END IF;

  SELECT loai_thiet_bi_id, la_linh_kien INTO v_loai, v_is_lk
    FROM public.thiet_bi WHERE id = NEW.linh_kien_id;
  IF v_is_lk IS NOT TRUE THEN
    RAISE EXCEPTION 'Thiết bị được gán không được đánh dấu là linh kiện';
  END IF;
  IF v_khe.loai_thiet_bi_yeu_cau IS NOT NULL
     AND v_loai IS DISTINCT FROM v_khe.loai_thiet_bi_yeu_cau THEN
    RAISE EXCEPTION 'Linh kiện không đúng loại yêu cầu của khe';
  END IF;

  IF NEW.don_vi_id_snapshot IS NULL THEN
    SELECT COALESCE(t.don_vi_quan_ly_id, t.don_vi_id) INTO v_don_vi
      FROM public.thiet_bi t WHERE t.id = NEW.linh_kien_id;
    NEW.don_vi_id_snapshot := v_don_vi;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER glk_before BEFORE INSERT OR UPDATE ON public.gan_linh_kien
  FOR EACH ROW EXECUTE FUNCTION public.trg_glk_before();
CREATE TRIGGER glk_audit AFTER INSERT OR UPDATE OR DELETE ON public.gan_linh_kien
  FOR EACH ROW EXECUTE FUNCTION public.trg_layer3_audit();

-- ========== Chặn ngừng khe khi còn gán hiệu lực ==========
CREATE OR REPLACE FUNCTION public.trg_khe_lk_before_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.trang_thai = 'ngung' AND OLD.trang_thai <> 'ngung'
     AND EXISTS (SELECT 1 FROM public.gan_linh_kien
                 WHERE khe_id = NEW.id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe còn linh kiện đang gán, hãy tháo trước khi ngừng';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER khe_lk_guard BEFORE UPDATE ON public.thiet_bi_khe_linh_kien
  FOR EACH ROW EXECUTE FUNCTION public.trg_khe_lk_before_update();

-- ========== Helper vòng đời cho linh kiện ==========
CREATE OR REPLACE FUNCTION public._mo_gan_lk(p_khe_id uuid, p_lk_id uuid, p_ly_do text, p_hong_hoc_id uuid, p_ghi_chu text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_cu uuid; v_dang uuid;
BEGIN
  v_dang := public._map_trang_thai_tb('khai thác');
  INSERT INTO public.gan_linh_kien(khe_id, linh_kien_id, ly_do, hong_hoc_id, ghi_chu, nguoi_thuc_hien)
  VALUES (p_khe_id, p_lk_id, p_ly_do, p_hong_hoc_id, p_ghi_chu, auth.uid())
  RETURNING id INTO v_id;

  SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = p_lk_id;
  UPDATE public.thiet_bi SET trang_thai_id = v_dang WHERE id = p_lk_id;
  INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
  VALUES (p_lk_id, v_cu, v_dang, now(), 'Lắp linh kiện vào khe', auth.uid());
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._dong_gan_lk(p_gan_id uuid, p_ly_do_gan text, p_hong_hoc_id uuid, p_trang_thai_moi uuid, p_ly_do_vd text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_lk uuid; v_cu uuid;
BEGIN
  UPDATE public.gan_linh_kien
    SET den_ngay = now(),
        ly_do = COALESCE(p_ly_do_gan, ly_do),
        hong_hoc_id = COALESCE(p_hong_hoc_id, hong_hoc_id)
    WHERE id = p_gan_id
    RETURNING linh_kien_id INTO v_lk;

  IF p_trang_thai_moi IS NOT NULL AND v_lk IS NOT NULL THEN
    SELECT trang_thai_id INTO v_cu FROM public.thiet_bi WHERE id = v_lk;
    UPDATE public.thiet_bi SET trang_thai_id = p_trang_thai_moi WHERE id = v_lk;
    INSERT INTO public.thiet_bi_vong_doi(thiet_bi_id, tu_trang_thai_id, den_trang_thai_id, thoi_diem, ly_do, nguoi_thuc_hien)
    VALUES (v_lk, v_cu, p_trang_thai_moi, now(), COALESCE(p_ly_do_vd,'Cập nhật trạng thái'), auth.uid());
  END IF;
END;
$$;

-- ========== RPC: lắp / tháo / thay thế / điều chuyển linh kiện ==========
CREATE OR REPLACE FUNCTION public.lap_linh_kien(p_khe_id uuid, p_linh_kien_id uuid, p_ghi_chu text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đang có linh kiện, hãy dùng Thay thế/Điều chuyển';
  END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Linh kiện đang được lắp ở khe khác';
  END IF;
  v_id := public._mo_gan_lk(p_khe_id, p_linh_kien_id, 'lắp mới', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.thao_linh_kien(p_khe_id uuid, p_ly_do text DEFAULT 'tháo', p_ghi_chu text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_gan uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT id INTO v_gan FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan IS NULL THEN RAISE EXCEPTION 'Khe chưa có linh kiện để tháo'; END IF;
  PERFORM public._dong_gan_lk(v_gan, 'tháo', NULL, public._map_trang_thai_tb(p_ly_do),
    'Tháo linh kiện khỏi khe: ' || COALESCE(p_ly_do,'tháo'));
END;
$$;

CREATE OR REPLACE FUNCTION public.thay_the_linh_kien(p_khe_id uuid, p_linh_kien_moi_id uuid, p_hong_hoc_id uuid DEFAULT NULL, p_ghi_chu text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_gan_cu uuid; v_id uuid; v_tt text;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Linh kiện mới đang được lắp ở khe khác';
  END IF;
  SELECT id INTO v_gan_cu FROM public.gan_linh_kien WHERE khe_id = p_khe_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_lk(v_gan_cu, 'thay do hỏng', p_hong_hoc_id,
      public._map_trang_thai_tb('sửa'), 'Thay thế linh kiện do hỏng');
  END IF;
  v_id := public._mo_gan_lk(p_khe_id, p_linh_kien_moi_id, 'thay do hỏng', p_hong_hoc_id, p_ghi_chu);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dieu_chuyen_linh_kien(p_linh_kien_id uuid, p_khe_moi_id uuid, p_ghi_chu text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_gan_cu uuid; v_tt text; v_id uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền quản lý thiết bị'; END IF;
  SELECT trang_thai INTO v_tt FROM public.thiet_bi_khe_linh_kien WHERE id = p_khe_moi_id FOR UPDATE;
  IF v_tt IS NULL THEN RAISE EXCEPTION 'Khe linh kiện đích không tồn tại'; END IF;
  IF v_tt <> 'hoat_dong' THEN RAISE EXCEPTION 'Khe linh kiện đích đã ngừng'; END IF;
  IF EXISTS (SELECT 1 FROM public.gan_linh_kien WHERE khe_id = p_khe_moi_id AND den_ngay IS NULL) THEN
    RAISE EXCEPTION 'Khe đích đang có linh kiện, hãy dùng Thay thế';
  END IF;
  SELECT id INTO v_gan_cu FROM public.gan_linh_kien WHERE linh_kien_id = p_linh_kien_id AND den_ngay IS NULL FOR UPDATE;
  IF v_gan_cu IS NOT NULL THEN
    PERFORM public._dong_gan_lk(v_gan_cu, 'điều chuyển', NULL, NULL, 'Điều chuyển linh kiện sang khe khác');
  END IF;
  v_id := public._mo_gan_lk(p_khe_moi_id, p_linh_kien_id, 'điều chuyển', NULL, p_ghi_chu);
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.lap_linh_kien(uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.thao_linh_kien(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.thay_the_linh_kien(uuid, uuid, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dieu_chuyen_linh_kien(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lap_linh_kien(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.thao_linh_kien(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.thay_the_linh_kien(uuid, uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.dieu_chuyen_linh_kien(uuid, uuid, text) TO authenticated, service_role;