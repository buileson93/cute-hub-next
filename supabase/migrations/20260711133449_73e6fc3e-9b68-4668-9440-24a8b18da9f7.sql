-- Gộp trùng: Nhà cung cấp, Loại thiết bị, Mẫu thiết bị (an toàn, giữ liên kết)

CREATE OR REPLACE FUNCTION public.gop_nha_cung_cap(p_source_ids uuid[], p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_name text;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp nhà cung cấp.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có nhà cung cấp nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_nha_cung_cap WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Nhà cung cấp giữ lại không tồn tại.';
  END IF;

  UPDATE public.thiet_bi
  SET nha_cung_cap_id = p_target_id,
      nha_cung_cap = v_target_name
  WHERE nha_cung_cap_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  DELETE FROM public.dm_nha_cung_cap WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', 0,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.gop_loai_thiet_bi(p_source_ids uuid[], p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_name text;
  v_models int := 0;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp loại thiết bị.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có loại thiết bị nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_loai_thiet_bi WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Loại thiết bị giữ lại không tồn tại.';
  END IF;

  UPDATE public.dm_model
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);
  GET DIAGNOSTICS v_models = ROW_COUNT;

  UPDATE public.thiet_bi
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  UPDATE public.bao_tri_chinh_sach
  SET loai_thiet_bi_id = p_target_id
  WHERE loai_thiet_bi_id = ANY(v_sources);

  DELETE FROM public.dm_loai_thiet_bi WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', v_models,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.gop_model(p_source_ids uuid[], p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_name text;
  v_devices int := 0;
  v_deleted int := 0;
  v_sources uuid[];
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp mẫu thiết bị.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có mẫu thiết bị nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten INTO v_target_name FROM public.dm_model WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Mẫu thiết bị giữ lại không tồn tại.';
  END IF;

  UPDATE public.thiet_bi
  SET model_id = p_target_id,
      model = v_target_name
  WHERE model_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  DELETE FROM public.dm_model WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'models_moved', 0,
    'devices_moved', v_devices,
    'deleted', v_deleted
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.gop_nha_cung_cap(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gop_loai_thiet_bi(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gop_model(uuid[], uuid) TO authenticated;