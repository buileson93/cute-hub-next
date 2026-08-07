-- 1. Cập nhật RLS cho phan_mem_ban_quyen: Bỏ don_vi_id IS NULL đối với user thường
DROP POLICY IF EXISTS pmbq_read_scope ON public.phan_mem_ban_quyen;
CREATE POLICY pmbq_read_scope ON public.phan_mem_ban_quyen FOR SELECT TO authenticated
  USING (
    public.is_active_user(public.current_uid())
    AND (
      public.can_manage_equipment(public.current_uid())
      OR (don_vi_id IS NOT NULL AND don_vi_id = public.get_user_don_vi_id(public.current_uid()))
    )
  );

-- 2. Cập nhật RLS cho phan_mem_ban_quyen_cap_phat
DROP POLICY IF EXISTS pmbq_cp_read_scope ON public.phan_mem_ban_quyen_cap_phat;
CREATE POLICY pmbq_cp_read_scope ON public.phan_mem_ban_quyen_cap_phat FOR SELECT TO authenticated
  USING (
    public.is_active_user(public.current_uid())
    AND EXISTS (
      SELECT 1 FROM public.phan_mem_ban_quyen bq
      WHERE bq.id = phan_mem_ban_quyen_cap_phat.ban_quyen_id
        AND (
          public.can_manage_equipment(public.current_uid())
          OR (bq.don_vi_id IS NOT NULL AND bq.don_vi_id = public.get_user_don_vi_id(public.current_uid()))
        )
    )
  );

-- 3. Cập nhật trigger chặn vượt số ghế với SELECT FOR UPDATE
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

  -- Khóa hàng bản quyền để tránh race condition
  SELECT so_ghe INTO v_so_ghe 
  FROM public.phan_mem_ban_quyen 
  WHERE id = NEW.ban_quyen_id 
  FOR UPDATE;

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

-- 4. Tự động sinh mã bản quyền nếu để trống
CREATE OR REPLACE FUNCTION public.pmbq_auto_ma()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ma_ban_quyen IS NULL OR NEW.ma_ban_quyen = '' THEN
    NEW.ma_ban_quyen := 'BQ_' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_pmbq_auto_ma
  BEFORE INSERT ON public.phan_mem_ban_quyen
  FOR EACH ROW EXECUTE FUNCTION public.pmbq_auto_ma();

-- 5. Đăng ký module bản quyền (nếu bảng dm_module tồn tại)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dm_module') THEN
        INSERT INTO public.dm_module (ma, ten, mo_ta)
        VALUES ('ban_quyen', 'Quản lý bản quyền', 'Quản lý phần mềm, license key và cấp phát cho thiết bị')
        ON CONFLICT (ma) DO UPDATE SET ten = EXCLUDED.ten, mo_ta = EXCLUDED.mo_ta;
    END IF;
END $$;