CREATE OR REPLACE FUNCTION public.sua_ngay_lap(
  p_gan_id uuid,
  p_tu_ngay timestamptz,
  p_ghi_chu text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_cu timestamptz;
  v_den timestamptz;
  v_tb uuid;
  v_tp uuid;
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền quản lý thiết bị';
  END IF;
  IF p_tu_ngay IS NULL THEN
    RAISE EXCEPTION 'Ngày lắp không được để trống';
  END IF;
  IF p_tu_ngay > now() THEN
    RAISE EXCEPTION 'Ngày lắp không được ở tương lai';
  END IF;

  SELECT tu_ngay, den_ngay, thiet_bi_id, thanh_phan_id
    INTO v_cu, v_den, v_tb, v_tp
  FROM public.gan_chuc_nang WHERE id = p_gan_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy lần lắp thiết bị';
  END IF;
  IF v_den IS NOT NULL AND p_tu_ngay > v_den THEN
    RAISE EXCEPTION 'Ngày lắp không được muộn hơn ngày tháo';
  END IF;

  UPDATE public.gan_chuc_nang
     SET tu_ngay = p_tu_ngay,
         ghi_chu = COALESCE(p_ghi_chu, ghi_chu)
   WHERE id = p_gan_id;

  INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
  VALUES (
    auth.uid(),
    'sua_ngay_lap',
    'gan_chuc_nang',
    p_gan_id::text,
    jsonb_build_object(
      'thiet_bi_id', v_tb,
      'thanh_phan_id', v_tp,
      'tu_ngay_cu', v_cu,
      'tu_ngay_moi', p_tu_ngay,
      'ghi_chu', p_ghi_chu
    )
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.sua_ngay_lap(uuid, timestamptz, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.sua_ngay_lap(uuid, timestamptz, text) FROM anon;