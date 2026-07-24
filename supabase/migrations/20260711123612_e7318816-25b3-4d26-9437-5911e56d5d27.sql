-- Hàm gộp (merge) nhiều nhà sản xuất trùng vào một bản chính, chuyển toàn bộ
-- liên kết của mẫu thiết bị & thiết bị sang bản chính trước khi xoá bản trùng.
CREATE OR REPLACE FUNCTION public.gop_nha_san_xuat(
  p_source_ids uuid[],
  p_target_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_name text;
  v_models int := 0;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  -- Chỉ admin / phòng kỹ thuật được gộp danh mục.
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp nhà sản xuất.';
  END IF;

  -- Loại bản chính khỏi danh sách nguồn (tránh tự gộp vào chính mình).
  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có nhà sản xuất nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_nha_san_xuat WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Nhà sản xuất giữ lại không tồn tại.';
  END IF;

  -- Chuyển mẫu thiết bị sang bản chính.
  UPDATE public.dm_model
  SET nha_san_xuat_id = p_target_id
  WHERE nha_san_xuat_id = ANY(v_sources);
  GET DIAGNOSTICS v_models = ROW_COUNT;

  -- Chuyển thiết bị (khoá ngoại) sang bản chính + đồng bộ tên dạng chữ.
  UPDATE public.thiet_bi
  SET nha_san_xuat_id = p_target_id,
      nha_san_xuat = v_target_name
  WHERE nha_san_xuat_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  -- Xoá các bản trùng.
  DELETE FROM public.dm_nha_san_xuat WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', v_models,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.gop_nha_san_xuat(uuid[], uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.gop_nha_san_xuat(uuid[], uuid) FROM anon;