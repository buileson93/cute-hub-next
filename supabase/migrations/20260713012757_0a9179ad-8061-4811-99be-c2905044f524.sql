
-- ============================================================================
-- ÁP DỤNG CÓ KIỂM SOÁT + HOÀN TÁC cho lô nhập liệu.
-- Bổ sung nhật ký (journal) trên import_item: action, target, before/after
-- snapshot, applied_at, rolled_back_at; và RPC apply / preview_rollback /
-- rollback chạy trong giao dịch, idempotent, an toàn FK.
-- ============================================================================

-- ---- 1. Cột nhật ký trên import_item ----
ALTER TABLE public.import_item
  ADD COLUMN IF NOT EXISTS action          text,
  ADD COLUMN IF NOT EXISTS target_table    text,
  ADD COLUMN IF NOT EXISTS target_id       uuid,
  ADD COLUMN IF NOT EXISTS before_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS after_snapshot  jsonb,
  ADD COLUMN IF NOT EXISTS applied_at      timestamptz,
  ADD COLUMN IF NOT EXISTS rolled_back_at  timestamptz;

-- action hợp lệ (hoặc NULL khi chưa quyết định)
ALTER TABLE public.import_item DROP CONSTRAINT IF EXISTS import_item_action_chk;
ALTER TABLE public.import_item ADD CONSTRAINT import_item_action_chk
  CHECK (action IS NULL OR action IN ('create','update','retire','keep','error','skip'));

-- Mở rộng trạng thái dòng: thêm 'rolled_back'
ALTER TABLE public.import_item DROP CONSTRAINT IF EXISTS import_item_status_chk;
ALTER TABLE public.import_item ADD CONSTRAINT import_item_status_chk
  CHECK (status IN ('staged','valid','error','committed','skipped','rolled_back'));

CREATE INDEX IF NOT EXISTS idx_import_item_apply
  ON public.import_item (batch_id, status, applied_at);

-- ---- 2. Cột trên import_batch ----
ALTER TABLE public.import_batch
  ADD COLUMN IF NOT EXISTS applied_at     timestamptz,
  ADD COLUMN IF NOT EXISTS rolled_back_at timestamptz;

ALTER TABLE public.import_batch DROP CONSTRAINT IF EXISTS import_batch_status_chk;
ALTER TABLE public.import_batch ADD CONSTRAINT import_batch_status_chk
  CHECK (status IN ('staged','reviewing','committed','discarded','rolled_back','partially_rolled_back'));

-- ---- 3. Danh sách bảng đích được phép áp dụng (chặn ghi vào bảng nhạy cảm) ----
CREATE OR REPLACE FUNCTION public._import_allowed_table(_tbl text)
RETURNS boolean
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT _tbl = ANY (ARRAY[
    'thiet_bi','dm_he_thong','dm_nhom_he_thong','dm_model','dm_nha_san_xuat',
    'dm_nha_cung_cap','dm_phan_loai','dm_linh_vuc','dm_loai_thiet_bi','dm_vi_tri',
    'dm_trang_thai_thiet_bi','dm_noi_cap','dm_loai_giay_phep','dm_danh_gia_nien_han',
    'dm_don_vi','he_thong_truong','giay_phep','giay_phep_khai_thac','vat_tu','kho'
  ]::text[])
$$;

-- ---- 4. RPC áp dụng lô: transaction, idempotent, chunk theo _limit ----
CREATE OR REPLACE FUNCTION public.apply_import_batch(_batch_id uuid, _limit int DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  it RECORD;
  _tbl text;
  _cols text;
  _assigns text;
  _before jsonb;
  _after jsonb;
  _new_id uuid;
  _created int := 0; _updated int := 0; _retired int := 0; _kept int := 0;
BEGIN
  IF _uid IS NULL OR NOT public.has_role(_uid, 'admin') THEN
    RAISE EXCEPTION 'Forbidden: chỉ Admin được áp dụng lô nhập';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.import_batch WHERE id = _batch_id) THEN
    RAISE EXCEPTION 'Không tìm thấy lô nhập %', _batch_id;
  END IF;

  FOR it IN
    SELECT * FROM public.import_item
    WHERE batch_id = _batch_id
      AND status = 'valid'
      AND applied_at IS NULL
      AND action IN ('create','update','retire','keep')
    ORDER BY sheet NULLS FIRST, row_index
    LIMIT _limit
  LOOP
    _tbl := COALESCE(it.target_table, it.cat_table, it.entity);

    -- KEEP: không ghi, chỉ ghi nhận ảnh chụp hiện tại.
    IF it.action = 'keep' THEN
      _before := NULL;
      IF it.target_id IS NOT NULL THEN
        EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE t.id = $1', _tbl)
          INTO _before USING it.target_id;
      END IF;
      UPDATE public.import_item
        SET target_table = _tbl, before_snapshot = _before, after_snapshot = _before,
            applied_at = now(), status = 'committed'
        WHERE id = it.id;
      _kept := _kept + 1;
      CONTINUE;
    END IF;

    IF NOT public._import_allowed_table(_tbl) THEN
      RAISE EXCEPTION 'Bảng đích không được phép áp dụng: %', _tbl;
    END IF;
    IF it.normalized_row IS NULL THEN
      RAISE EXCEPTION 'Dòng % thiếu dữ liệu chuẩn hoá (normalized_row)', it.row_index;
    END IF;

    IF it.action = 'create' THEN
      SELECT string_agg(quote_ident(k), ', ') INTO _cols
      FROM jsonb_object_keys(it.normalized_row) k
      WHERE EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      IF _cols IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không có cột hợp lệ để tạo', it.row_index;
      END IF;
      EXECUTE format(
        'INSERT INTO public.%1$I (%2$s) SELECT %2$s FROM jsonb_populate_record(null::public.%1$I, $1) RETURNING id, to_jsonb(%1$I.*)',
        _tbl, _cols
      ) USING it.normalized_row INTO _new_id, _after;

      UPDATE public.import_item
        SET target_table = _tbl, target_id = _new_id, before_snapshot = NULL,
            after_snapshot = _after, applied_at = now(), status = 'committed'
        WHERE id = it.id;
      INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
        VALUES (_uid, 'import_apply_create', _tbl, _new_id::text,
                jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
      _created := _created + 1;

    ELSE  -- update / retire (retire = cập nhật, KHÔNG xóa cứng)
      IF it.target_id IS NULL THEN
        RAISE EXCEPTION 'Dòng % (%): thiếu target_id', it.row_index, it.action;
      END IF;
      EXECUTE format('SELECT to_jsonb(t.*) FROM public.%I t WHERE t.id = $1', _tbl)
        INTO _before USING it.target_id;
      IF _before IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không tìm thấy bản ghi đích % trong %', it.row_index, it.target_id, _tbl;
      END IF;

      SELECT string_agg(quote_ident(k) || ' = s.' || quote_ident(k), ', ') INTO _assigns
      FROM jsonb_object_keys(it.normalized_row) k
      WHERE k NOT IN ('id','created_at')
        AND EXISTS (SELECT 1 FROM information_schema.columns c
                    WHERE c.table_schema='public' AND c.table_name=_tbl AND c.column_name=k);
      IF _assigns IS NULL THEN
        RAISE EXCEPTION 'Dòng %: không có cột hợp lệ để cập nhật', it.row_index;
      END IF;
      EXECUTE format(
        'UPDATE public.%1$I AS t SET %2$s FROM jsonb_populate_record(null::public.%1$I, $1) s WHERE t.id = $2 RETURNING to_jsonb(t.*)',
        _tbl, _assigns
      ) USING it.normalized_row, it.target_id INTO _after;

      UPDATE public.import_item
        SET target_table = _tbl, before_snapshot = _before, after_snapshot = _after,
            applied_at = now(), status = 'committed'
        WHERE id = it.id;
      INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
        VALUES (_uid, 'import_apply_' || it.action, _tbl, it.target_id::text,
                jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
      IF it.action = 'retire' THEN _retired := _retired + 1; ELSE _updated := _updated + 1; END IF;
    END IF;
  END LOOP;

  UPDATE public.import_batch
    SET status = 'committed',
        applied_at = COALESCE(applied_at, now()),
        summary = summary || jsonb_build_object(
          'applied', jsonb_build_object('created',_created,'updated',_updated,'retired',_retired,'kept',_kept))
    WHERE id = _batch_id;

  RETURN jsonb_build_object('ok', true, 'created',_created,'updated',_updated,'retired',_retired,'kept',_kept);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_import_batch(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_import_batch(uuid, int) TO authenticated;

-- ---- 5. RPC xem trước hoàn tác (chỉ đọc, dùng savepoint để thử xóa) ----
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
      -- thử xóa trong subtransaction rồi ép rollback bằng exception tuỳ biến
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE id = $1', _tbl) USING it.target_id;
        RAISE EXCEPTION 'mirats_rollback_probe_ok';
      EXCEPTION
        WHEN foreign_key_violation THEN
          _ok := false; _reason := 'Đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
        WHEN OTHERS THEN
          IF SQLERRM = 'mirats_rollback_probe_ok' THEN
            _ok := true;
          ELSE
            _ok := false; _reason := 'Không thể xóa: ' || SQLERRM;
          END IF;
      END;
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

REVOKE EXECUTE ON FUNCTION public.preview_rollback_import_batch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_rollback_import_batch(uuid) TO authenticated;

-- ---- 6. RPC hoàn tác lô: xóa an toàn (create) / khôi phục before (update/retire) ----
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
      BEGIN
        EXECUTE format('DELETE FROM public.%I WHERE id = $1', _tbl) USING it.target_id;
        UPDATE public.import_item SET rolled_back_at = now(), status = 'rolled_back' WHERE id = it.id;
        INSERT INTO public.audit_log(user_id, action, entity, entity_id, detail)
          VALUES (_uid, 'import_rollback_delete', _tbl, it.target_id::text,
                  jsonb_build_object('batch_id', _batch_id, 'item_id', it.id));
        _rolled := _rolled + 1;
      EXCEPTION WHEN foreign_key_violation THEN
        _reason := 'Bản ghi đã có dữ liệu tham chiếu/lịch sử — không thể tự xóa';
        _blocked := _blocked + 1;
        _blocked_list := _blocked_list || jsonb_build_object(
          'item_id', it.id, 'target_table', _tbl, 'target_id', it.target_id,
          'action', it.action, 'reason', _reason);
        UPDATE public.import_item
          SET messages = messages || jsonb_build_array(
            jsonb_build_object('type','rollback_blocked','text',_reason))
          WHERE id = it.id;
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

REVOKE EXECUTE ON FUNCTION public.rollback_import_batch(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rollback_import_batch(uuid) TO authenticated;
