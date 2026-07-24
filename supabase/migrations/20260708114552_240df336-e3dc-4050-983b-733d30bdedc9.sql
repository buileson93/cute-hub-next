CREATE OR REPLACE FUNCTION public.admin_rollback_audit(_audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.audit_log;
  v_table text;
  v_old jsonb;
  v_new jsonb;
  v_id text;
  v_set text;
  v_result text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Chỉ admin mới được hoàn tác dữ liệu';
  END IF;

  SELECT * INTO v_row FROM public.audit_log WHERE id = _audit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy bản ghi nhật ký';
  END IF;

  v_table := v_row.entity;
  IF v_table IS NULL OR v_table !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Tên bảng không hợp lệ';
  END IF;

  -- only business tables can be rolled back
  IF NOT (v_table ~ '^(dm_|thiet_bi|giay_phep|form_|cay_node_edit|so_do|du_an|notifications)') THEN
    RAISE EXCEPTION 'Không hỗ trợ hoàn tác cho bảng "%"', v_table;
  END IF;
  IF v_table IN ('audit_log','profiles','user_roles') THEN
    RAISE EXCEPTION 'Không được hoàn tác bảng hệ thống "%"', v_table;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema='public' AND table_name=v_table AND table_type='BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'Bảng "%" không tồn tại', v_table;
  END IF;

  v_old := v_row.detail->'old';
  v_new := v_row.detail->'new';

  IF v_row.action LIKE 'update\_%' THEN
    IF v_old IS NULL OR v_old->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu cũ để khôi phục';
    END IF;
    v_id := v_old->>'id';

    SELECT string_agg(format('%I = s.%I', c.column_name, c.column_name), ', ')
    INTO v_set
    FROM information_schema.columns c
    WHERE c.table_schema='public' AND c.table_name=v_table
      AND c.column_name <> 'id';

    EXECUTE format(
      'UPDATE public.%I AS t SET %s FROM (SELECT * FROM jsonb_populate_record(NULL::public.%I, $1)) AS s WHERE t.id = $2',
      v_table, v_set, v_table
    ) USING v_old, v_id;
    v_result := 'restored_update';

  ELSIF v_row.action LIKE 'delete\_%' THEN
    IF v_old IS NULL OR v_old->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu cũ để khôi phục';
    END IF;
    v_id := v_old->>'id';
    IF EXISTS (SELECT 1 FROM public.audit_log WHERE 1=0) THEN NULL; END IF;

    EXECUTE format(
      'INSERT INTO public.%I SELECT * FROM jsonb_populate_record(NULL::public.%I, $1) ON CONFLICT (id) DO NOTHING',
      v_table, v_table
    ) USING v_old;
    v_result := 'restored_delete';

  ELSIF v_row.action LIKE 'insert\_%' THEN
    IF v_new IS NULL OR v_new->>'id' IS NULL THEN
      RAISE EXCEPTION 'Không có dữ liệu để hoàn tác';
    END IF;
    v_id := v_new->>'id';
    EXECUTE format('DELETE FROM public.%I WHERE id = $1', v_table) USING v_id;
    v_result := 'undo_insert';

  ELSE
    RAISE EXCEPTION 'Hành động "%" không thể hoàn tác', v_row.action;
  END IF;

  PERFORM public.log_app_event('rollback_audit', v_table, v_id,
    jsonb_build_object('audit_id', _audit_id, 'original_action', v_row.action, 'result', v_result));

  RETURN jsonb_build_object('ok', true, 'table', v_table, 'id', v_id, 'result', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_rollback_audit(uuid) TO authenticated;