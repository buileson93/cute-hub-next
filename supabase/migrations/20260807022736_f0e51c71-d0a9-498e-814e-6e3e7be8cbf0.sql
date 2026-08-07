-- 1. Danh mục loại bản quyền
CREATE TABLE public.dm_loai_ban_quyen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text NOT NULL UNIQUE,
  ten text NOT NULL,
  mo_ta text,
  thu_tu int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dm_loai_ban_quyen TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dm_loai_ban_quyen TO authenticated;
GRANT ALL ON public.dm_loai_ban_quyen TO service_role;
ALTER TABLE public.dm_loai_ban_quyen ENABLE ROW LEVEL SECURITY;
CREATE POLICY dm_loai_ban_quyen_read ON public.dm_loai_ban_quyen FOR SELECT TO authenticated
  USING (public.is_active_user(public.current_uid()));
CREATE POLICY dm_loai_ban_quyen_write ON public.dm_loai_ban_quyen FOR ALL TO authenticated
  USING (public.can_manage_equipment(public.current_uid()))
  WITH CHECK (public.can_manage_equipment(public.current_uid()));

INSERT INTO public.dm_loai_ban_quyen (ma, ten, mo_ta, thu_tu) VALUES
  ('vinh_vien','Vĩnh viễn','Mua đứt, không hết hạn',1),
  ('thue_bao','Thuê bao','Trả phí định kỳ, có ngày hết hạn',2),
  ('oem','OEM','Đi kèm thiết bị, gắn với máy',3),
  ('volume','Volume/Khối lượng','Hợp đồng nhiều ghế',4),
  ('open_source','Nguồn mở','Miễn phí theo giấy phép mở',5),
  ('dung_thu','Dùng thử','Bản dùng thử có thời hạn',6);

-- 2. Bản quyền phần mềm
CREATE TABLE public.phan_mem_ban_quyen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_ban_quyen text NOT NULL UNIQUE,
  ten_phan_mem text NOT NULL,
  nha_phat_hanh text,
  phien_ban text,
  loai_ban_quyen_id uuid REFERENCES public.dm_loai_ban_quyen(id) ON DELETE SET NULL,
  license_key text,
  so_ghe int CHECK (so_ghe IS NULL OR so_ghe > 0),
  ngay_mua date,
  ngay_bat_dau date,
  ngay_het_han date,
  gia_tri numeric,
  so_hop_dong text,
  don_vi_id uuid REFERENCES public.dm_don_vi(id) ON DELETE SET NULL,
  nha_cung_cap_id uuid REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL,
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pmbq_het_han ON public.phan_mem_ban_quyen(ngay_het_han);
CREATE INDEX idx_pmbq_don_vi ON public.phan_mem_ban_quyen(don_vi_id);
CREATE INDEX idx_pmbq_loai ON public.phan_mem_ban_quyen(loai_ban_quyen_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phan_mem_ban_quyen TO authenticated;
GRANT ALL ON public.phan_mem_ban_quyen TO service_role;
ALTER TABLE public.phan_mem_ban_quyen ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmbq_read_scope ON public.phan_mem_ban_quyen FOR SELECT TO authenticated
  USING (
    public.is_active_user(public.current_uid())
    AND (
      public.can_manage_equipment(public.current_uid())
      OR don_vi_id IS NULL
      OR don_vi_id = public.get_user_don_vi_id(public.current_uid())
    )
  );
CREATE POLICY pmbq_write_manager ON public.phan_mem_ban_quyen FOR ALL TO authenticated
  USING (public.can_manage_equipment(public.current_uid()))
  WITH CHECK (public.can_manage_equipment(public.current_uid()));

-- 3. Cấp phát bản quyền cho tài sản
CREATE TABLE public.phan_mem_ban_quyen_cap_phat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_quyen_id uuid NOT NULL REFERENCES public.phan_mem_ban_quyen(id) ON DELETE CASCADE,
  thiet_bi_id uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  ngay_cai_dat date NOT NULL DEFAULT CURRENT_DATE,
  nguoi_cai text,
  ngay_thu_hoi date,
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_pmbq_cap_phat_active
  ON public.phan_mem_ban_quyen_cap_phat(ban_quyen_id, thiet_bi_id)
  WHERE ngay_thu_hoi IS NULL;
CREATE INDEX idx_pmbq_cp_thiet_bi ON public.phan_mem_ban_quyen_cap_phat(thiet_bi_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phan_mem_ban_quyen_cap_phat TO authenticated;
GRANT ALL ON public.phan_mem_ban_quyen_cap_phat TO service_role;
ALTER TABLE public.phan_mem_ban_quyen_cap_phat ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmbq_cp_read_scope ON public.phan_mem_ban_quyen_cap_phat FOR SELECT TO authenticated
  USING (
    public.is_active_user(public.current_uid())
    AND EXISTS (
      SELECT 1 FROM public.phan_mem_ban_quyen bq
      WHERE bq.id = phan_mem_ban_quyen_cap_phat.ban_quyen_id
        AND (
          public.can_manage_equipment(public.current_uid())
          OR bq.don_vi_id IS NULL
          OR bq.don_vi_id = public.get_user_don_vi_id(public.current_uid())
        )
    )
  );
CREATE POLICY pmbq_cp_write_manager ON public.phan_mem_ban_quyen_cap_phat FOR ALL TO authenticated
  USING (public.can_manage_equipment(public.current_uid()))
  WITH CHECK (public.can_manage_equipment(public.current_uid()));

-- 4. Tệp đính kèm bản quyền
CREATE TABLE public.phan_mem_ban_quyen_tep (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_quyen_id uuid NOT NULL REFERENCES public.phan_mem_ban_quyen(id) ON DELETE CASCADE,
  ten_tep text NOT NULL,
  duong_dan text NOT NULL,
  mime_type text,
  kich_thuoc bigint,
  storage_provider text NOT NULL DEFAULT 'supabase',
  ghi_chu text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pmbq_tep_bq ON public.phan_mem_ban_quyen_tep(ban_quyen_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phan_mem_ban_quyen_tep TO authenticated;
GRANT ALL ON public.phan_mem_ban_quyen_tep TO service_role;
ALTER TABLE public.phan_mem_ban_quyen_tep ENABLE ROW LEVEL SECURITY;
CREATE POLICY pmbq_tep_read_scope ON public.phan_mem_ban_quyen_tep FOR SELECT TO authenticated
  USING (
    public.is_active_user(public.current_uid())
    AND EXISTS (
      SELECT 1 FROM public.phan_mem_ban_quyen bq
      WHERE bq.id = phan_mem_ban_quyen_tep.ban_quyen_id
        AND (
          public.can_manage_equipment(public.current_uid())
          OR bq.don_vi_id IS NULL
          OR bq.don_vi_id = public.get_user_don_vi_id(public.current_uid())
        )
    )
  );
CREATE POLICY pmbq_tep_write_manager ON public.phan_mem_ban_quyen_tep FOR ALL TO authenticated
  USING (public.can_manage_equipment(public.current_uid()))
  WITH CHECK (public.can_manage_equipment(public.current_uid()));

-- 5. Cờ nhận diện chủng loại máy tính
ALTER TABLE public.dm_loai_thiet_bi ADD COLUMN IF NOT EXISTS la_may_tinh boolean NOT NULL DEFAULT false;

-- 6. Trigger updated_at
CREATE TRIGGER trg_pmbq_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pmbq_cp_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen_cap_phat
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pmbq_tep_updated_at BEFORE UPDATE ON public.phan_mem_ban_quyen_tep
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dm_loai_ban_quyen_updated_at BEFORE UPDATE ON public.dm_loai_ban_quyen
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Trigger chặn vượt số ghế
CREATE OR REPLACE FUNCTION public.pmbq_check_seats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_so_ghe int;
  v_dang_dung int;
BEGIN
  IF NEW.ngay_thu_hoi IS NOT NULL THEN
    RETURN NEW;
  END IF;
  SELECT so_ghe INTO v_so_ghe FROM public.phan_mem_ban_quyen WHERE id = NEW.ban_quyen_id;
  IF v_so_ghe IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_dang_dung
  FROM public.phan_mem_ban_quyen_cap_phat
  WHERE ban_quyen_id = NEW.ban_quyen_id
    AND ngay_thu_hoi IS NULL
    AND id IS DISTINCT FROM NEW.id;
  IF v_dang_dung >= v_so_ghe THEN
    RAISE EXCEPTION 'Bản quyền đã dùng hết % ghế, không thể cấp phát thêm', v_so_ghe;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pmbq_check_seats
  BEFORE INSERT OR UPDATE ON public.phan_mem_ban_quyen_cap_phat
  FOR EACH ROW EXECUTE FUNCTION public.pmbq_check_seats();

-- 8. RPC thống kê tổng hợp
CREATE OR REPLACE FUNCTION public.ban_quyen_tong_hop()
RETURNS TABLE (
  tong_ban_quyen bigint,
  sap_het_han bigint,
  da_het_han bigint,
  tong_ghe bigint,
  ghe_da_dung bigint,
  tong_gia_tri numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    count(*)::bigint,
    count(*) FILTER (WHERE bq.ngay_het_han IS NOT NULL
      AND bq.ngay_het_han >= CURRENT_DATE
      AND bq.ngay_het_han <= CURRENT_DATE + 60)::bigint,
    count(*) FILTER (WHERE bq.ngay_het_han IS NOT NULL AND bq.ngay_het_han < CURRENT_DATE)::bigint,
    COALESCE(sum(bq.so_ghe), 0)::bigint,
    COALESCE((SELECT count(*) FROM public.phan_mem_ban_quyen_cap_phat cp WHERE cp.ngay_thu_hoi IS NULL), 0)::bigint,
    COALESCE(sum(bq.gia_tri), 0)
  FROM public.phan_mem_ban_quyen bq;
$$;
GRANT EXECUTE ON FUNCTION public.ban_quyen_tong_hop() TO authenticated;