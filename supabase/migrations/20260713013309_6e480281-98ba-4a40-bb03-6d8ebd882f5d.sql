
-- Kiểm tra bản ghi có đang bị bảng khác tham chiếu (có "lịch sử"/dữ liệu liên quan) không.
CREATE OR REPLACE FUNCTION public._import_has_dependents(_tbl text, _id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  ex boolean;
BEGIN
  FOR r IN
    SELECT (con.conrelid::regclass)::text AS child_tbl,
           att.attname AS child_col
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
    WHERE con.contype = 'f'
      AND con.confrelid = ('public.' || _tbl)::regclass
      AND array_length(con.conkey, 1) = 1
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE %I = $1)', r.child_tbl, r.child_col)
      INTO ex USING _id;
    IF ex THEN RETURN true; END IF;
  END LOOP;
  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public._import_has_dependents(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._import_has_dependents(text, uuid) TO authenticated;

-- ---- Xem trước hoàn tác (dùng kiểm tra dependents thay cho FK-probe) ----
CREATE OR REPLACE FUNCTION public.preview_rollback_import_batch(_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  it RECORD;
  _tbl text;
  _can int := 0; _cannot int := 0;
  _items jsonb := '[]'::jsonb;
  _ok boolean; _reason text;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin';
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id AND applied_at IS NOT NULL
      AND rolled_back_at IS NULL AND status = 'committed'
    ORDER BY sheet NULLS LAST, row_index DESC
  LOOP
    _tbl := it.target_table; _ok := true; _reason := NULL;

    IF it.action = 'keep' OR it.target_id IS NULL THEN
      _ok := true;
    ELSIF it.action = 'create' THEN
      IF public._import_has_dependents(_tbl, it.target_id) THEN
        _ok := false; _reason := 'Đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
      END IF;
    ELSE  -- update / retire
      IF it.before_snapshot IS NULL THEN
        _ok := false; _reason := 'Thiếu ảnh chụp trước (before_snapshot)';
      ELSE
        EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE id = $1)', _tbl)
          INTO _ok USING it.target_id;
        IF NOT _ok THEN _reason := 'Bản ghi đích không còn tồn tại'; END IF;
      END IF;
    END IF;

    IF _ok THEN _can := _can + 1; ELSE _cannot := _cannot + 1; END IF;
    _items := _items || jsonb_build_object(
      'item_id', it.id, 'row_index', it.row_index, 'action', it.action,
      'target_table', _tbl, 'target_id', it.target_id,
      'can_rollback', _ok, 'reason', _reason);
  END LOOP;

  RETURN jsonb_build_object('total', _can + _cannot, 'can', _can, 'cannot', _cannot, 'items', _items);
END;
$$;

-- ---- Hoàn tác lô (an toàn: chỉ xóa khi không còn dependents) ----
CREATE OR REPLACE FUNCTION public.rollback_import_batch(_batch_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  it RECORD;
  _tbl text; _assigns text;
  _rolled int := 0; _blocked int := 0;
  _blocked_list jsonb := '[]'::jsonb;
  _reason text;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được hoàn tác lô nhập';
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id AND applied_at IS NOT NULL
      AND rolled_back_at IS NULL AND status = 'committed'
    ORDER BY sheet NULLS LAST, row_index DESC
  LOOP
    _tbl := it.target_table;

    IF it.action = 'keep' OR it.target_id IS NULL THEN
      UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
      _rolled := _rolled + 1;
      CONTINUE;
    END IF;

    IF it.action = 'create' THEN
      IF public._import_has_dependents(_tbl, it.target_id) THEN
        _reason := 'Bản ghi đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
        UPDATE public.import_item
          SET messages = messages || jsonb_build_array(
            jsonb_build_object('type','rollback_blocked','text',_reason))
          WHERE id = it.id;
        CONTINUE;
      END IF;
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE id = $1', _tbl) USING it.target_id;
        UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
        INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
          VALUES (_uid, 'import_rollback_delete', _tbl, it.target_id::text,
                  jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
        _rolled := _rolled + 1;
      EXCEPTION WHEN OTHERS THEN
        _reason := 'Không thể xóa: ' || SQLERRM;
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
      END;

    ELSE  -- update / retire → khôi phục ảnh chụp trước
      IF it.before_snapshot IS NULL THEN
        _reason := 'Thiếu ảnh chụp trước — không thể khôi phục';
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
        CONTINUE;
      END IF;
      SELECT string_agg(quote_ident(k) || ' = s.' || quote_ident(k), ', ') INTO _assigns
      FROM jsonb_object_keys(it.before_snapshot) k
      WHERE k NOT IN ('id')
        AND EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      BEGIN
        EXECUTE format(
          'UPDATE public.%1$I AS t SET %2$s FROM jsonb_populate_record(null::public.%1$I, $1) s WHERE t.id = $2',
          _tbl, _assigns
        ) USING it.before_snapshot, it.target_id;
        UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
        INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
          VALUES (_uid, 'import_rollback_restore', _tbl, it.target_id::text,
                  jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
        _rolled := _rolled + 1;
      EXCEPTION WHEN OTHERS THEN
        _reason := 'Khôi phục lỗi: ' || SQLERRM;
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
      END;
    END IF;
  END LOOP;

  UPDATE public.import_batch
    SET status = CASE WHEN _blocked = 0 THEN 'rolled_back' ELSE 'partially_rolled_back' END,
        rolled_back_at = now(),
        summary = summary || jsonb_build_object(
          'rollback', jsonb_build_object('rolled',_rolled,'blocked',_blocked))
    WHERE id = _batch_id;

  RETURN jsonb_build_object('ok', _blocked = 0, 'rolled', _rolled, 'blocked', _blocked, 'blocked_list', _blocked_list);
END;
$$;
