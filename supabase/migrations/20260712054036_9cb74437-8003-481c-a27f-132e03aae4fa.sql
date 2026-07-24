CREATE OR REPLACE FUNCTION public.gop_vi_tri(p_source_ids uuid[], p_target_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_target_name text;
  v_target_ma text;
  v_sources uuid[];
  v_source_mas text[];
  v_devices int := 0;
  v_children int := 0;
  v_media int := 0;
  v_deleted int := 0;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'phong_kt')) THEN
    RAISE EXCEPTION 'Không có quyền gộp vị trí.';
  END IF;

  SELECT array_agg(s) INTO v_sources
  FROM unnest(p_source_ids) s
  WHERE s <> p_target_id;

  IF v_sources IS NULL OR array_length(v_sources, 1) = 0 THEN
    RAISE EXCEPTION 'Không có vị trí nguồn hợp lệ để gộp.';
  END IF;

  SELECT ten, ma INTO v_target_name, v_target_ma FROM public.dm_vi_tri WHERE id = p_target_id;
  IF v_target_name IS NULL THEN
    RAISE EXCEPTION 'Vị trí giữ lại không tồn tại.';
  END IF;

  SELECT array_agg(ma) INTO v_source_mas
  FROM public.dm_vi_tri WHERE id = ANY(v_sources) AND ma IS NOT NULL;

  -- Chuyển thiết bị sang vị trí đích
  UPDATE public.thiet_bi
  SET vi_tri_id = p_target_id
  WHERE vi_tri_id = ANY(v_sources);
  GET DIAGNOSTICS v_devices = ROW_COUNT;

  -- Chuyển vị trí con (đang trực thuộc nguồn) sang trực thuộc đích
  UPDATE public.dm_vi_tri
  SET parent_id = p_target_id
  WHERE parent_id = ANY(v_sources) AND id <> p_target_id;
  GET DIAGNOSTICS v_children = ROW_COUNT;

  -- Chuyển media (ảnh/360/3D) sang mã vị trí đích
  IF v_source_mas IS NOT NULL AND v_target_ma IS NOT NULL THEN
    UPDATE public.vi_tri_media
    SET vi_tri_ma = v_target_ma
    WHERE vi_tri_ma = ANY(v_source_mas);
    GET DIAGNOSTICS v_media = ROW_COUNT;
  END IF;

  DELETE FROM public.dm_vi_tri WHERE id = ANY(v_sources);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'target_name', v_target_name,
    'devices_moved', v_devices,
    'children_moved', v_children,
    'media_moved', v_media,
    'deleted', v_deleted
  );
END;
$function$;