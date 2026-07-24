-- Cho phép 2 loại thay đổi mới trong hàng đợi tổ chức lại cây
CREATE OR REPLACE FUNCTION public.cay_submit_change(_loai text, _he_thong_id text, _mo_ta text, _payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE v_id uuid; v_admin boolean; v_mgr boolean;
BEGIN
  v_admin := public.has_role(auth.uid(), 'admin'::app_role);
  v_mgr := public.can_manage_equipment(auth.uid());
  IF NOT v_mgr THEN RAISE EXCEPTION 'Ban khong co quyen chinh sua so do he thong'; END IF;
  IF _loai NOT IN ('move_system','move_systems','move_device','custom_fields') THEN
    RAISE EXCEPTION 'Loai thay doi khong hop le';
  END IF;

  INSERT INTO public.cay_thay_doi(loai, he_thong_id, mo_ta, payload, trang_thai, nguoi_tao)
  VALUES (_loai, NULLIF(_he_thong_id,''), _mo_ta, COALESCE(_payload, '{}'::jsonb),
          CASE WHEN v_admin THEN 'da_duyet' ELSE 'cho_duyet' END, auth.uid())
  RETURNING id INTO v_id;

  IF v_admin THEN
    PERFORM public._cay_apply(v_id);
    UPDATE public.cay_thay_doi SET nguoi_duyet = auth.uid(), duyet_luc = now() WHERE id = v_id;
    PERFORM public.log_app_event('cay_apply', 'cay_thay_doi', v_id::text, jsonb_build_object('loai', _loai, 'he_thong_id', _he_thong_id));
  END IF;
  RETURN jsonb_build_object('id', v_id, 'applied', v_admin);
END;
$fn$;

-- Áp dụng thay đổi
CREATE OR REPLACE FUNCTION public._cay_apply(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r public.cay_thay_doi;
  snap jsonb := '{}'::jsonb;
  v_to_nhom uuid;
  v_to_lv uuid;
  v_to_nh_key text;
  v_to_nh_ten text;
  v_ids uuid[];
  v_dev_ma text;
  v_to_ht uuid;
  v_ht_nhom uuid;
  v_ht_lv uuid;
BEGIN
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF r.da_ap_dung THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF r.loai = 'move_system' THEN
    v_to_nhom := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_lv := NULLIF(r.payload->>'to_lv_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');
    v_to_nh_ten := NULLIF(r.payload->>'to_nh_ten','');

    SELECT jsonb_build_object(
      'he_thong', (SELECT jsonb_build_object('nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)
                   FROM public.dm_he_thong WHERE id = r.he_thong_id::uuid),
      'thiet_bi', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)), '[]'::jsonb)
                   FROM public.thiet_bi WHERE he_thong_id = r.he_thong_id::uuid),
      'node_edit', (SELECT to_jsonb(c) FROM public.cay_node_edit c WHERE c.kind = 'ht' AND c.ma = r.he_thong_id LIMIT 1)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE id = r.he_thong_id::uuid;

    UPDATE public.thiet_bi
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE he_thong_id = r.he_thong_id::uuid;

    IF v_to_nh_key IS NOT NULL THEN
      INSERT INTO public.cay_node_edit(kind, ma, ten, du_lieu, created_by)
      VALUES ('ht', r.he_thong_id, NULL,
        jsonb_build_object('manual_nh_key', v_to_nh_key, 'manual_nh_ten', COALESCE(v_to_nh_ten, v_to_nh_key)),
        r.nguoi_tao)
      ON CONFLICT (kind, ma) DO UPDATE
        SET du_lieu = COALESCE(public.cay_node_edit.du_lieu, '{}'::jsonb)
          || jsonb_build_object('manual_nh_key', v_to_nh_key, 'manual_nh_ten', COALESCE(v_to_nh_ten, v_to_nh_key)),
            updated_at = now();
    END IF;

  ELSIF r.loai = 'move_systems' THEN
    v_to_nhom := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_lv := NULLIF(r.payload->>'to_lv_id','')::uuid;
    SELECT array_agg(x::uuid) INTO v_ids
      FROM jsonb_array_elements_text(COALESCE(r.payload->'system_ids','[]'::jsonb)) x;

    SELECT jsonb_build_object(
      'he_thong', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                   FROM public.dm_he_thong WHERE id = ANY(v_ids)), '[]'::jsonb),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                   FROM public.thiet_bi WHERE he_thong_id = ANY(v_ids)), '[]'::jsonb)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE id = ANY(v_ids);

    UPDATE public.thiet_bi
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE he_thong_id = ANY(v_ids);

  ELSIF r.loai = 'move_device' THEN
    v_dev_ma := r.payload->>'device_ma';
    v_to_ht := NULLIF(r.payload->>'to_ht_id','')::uuid;
    SELECT nhom_he_thong_id, linh_vuc_id INTO v_ht_nhom, v_ht_lv
      FROM public.dm_he_thong WHERE id = v_to_ht;

    SELECT jsonb_build_object('thiet_bi',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'he_thong_id', he_thong_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
       FROM public.thiet_bi WHERE ma_thiet_bi = v_dev_ma), '[]'::jsonb)) INTO snap;

    UPDATE public.thiet_bi
      SET he_thong_id = v_to_ht,
          nhom_he_thong_id = COALESCE(v_ht_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_ht_lv, linh_vuc_id)
      WHERE ma_thiet_bi = v_dev_ma;

  ELSIF r.loai = 'custom_fields' THEN
    SELECT jsonb_build_object('he_thong_truong',
      COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.he_thong_truong t WHERE t.he_thong_id = r.he_thong_id), '[]'::jsonb)
    ) INTO snap;
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong (he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu, created_by)
    SELECT r.he_thong_id, f->>'field_key', f->>'nhan', COALESCE(f->>'kieu','text'),
           COALESCE(f->'tuy_chon','[]'::jsonb), COALESCE((f->>'thu_tu')::int, 0), r.nguoi_tao
    FROM jsonb_array_elements(COALESCE(r.payload->'fields','[]'::jsonb)) f
    WHERE COALESCE(f->>'field_key','') <> '';

  ELSE
    RAISE EXCEPTION 'Loai thay doi khong ho tro: %', r.loai;
  END IF;

  UPDATE public.cay_thay_doi
    SET snapshot_cu = snap, da_ap_dung = true, trang_thai = 'da_duyet'
    WHERE id = _id;
  RETURN jsonb_build_object('ok', true);
END;
$fn$;

-- Hoàn tác
CREATE OR REPLACE FUNCTION public.cay_hoan_tac(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r public.cay_thay_doi;
  snap jsonb;
  v_ht jsonb;
  v_node jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Chi admin moi hoan tac'; END IF;
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF NOT r.da_ap_dung THEN RAISE EXCEPTION 'Thay doi chua duoc ap dung'; END IF;
  IF r.da_hoan_tac THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;
  snap := r.snapshot_cu;

  IF r.loai = 'move_system' THEN
    v_ht := snap->'he_thong';
    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = NULLIF(v_ht->>'nhom_he_thong_id','')::uuid,
          linh_vuc_id = NULLIF(v_ht->>'linh_vuc_id','')::uuid
      WHERE id = r.he_thong_id::uuid;

    UPDATE public.thiet_bi t
      SET nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid,
          linh_vuc_id = NULLIF(e->>'linh_vuc_id','')::uuid
      FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e
      WHERE t.id = (e->>'id')::uuid;

    v_node := snap->'node_edit';
    IF v_node IS NULL OR v_node = 'null'::jsonb THEN
      DELETE FROM public.cay_node_edit WHERE kind = 'ht' AND ma = r.he_thong_id;
    ELSE
      INSERT INTO public.cay_node_edit (id, kind, ma, don_vi_ma, ten, du_lieu, created_by, created_at, updated_at)
      VALUES (
        (v_node->>'id')::uuid, v_node->>'kind', v_node->>'ma', NULLIF(v_node->>'don_vi_ma',''),
        NULLIF(v_node->>'ten',''), COALESCE(v_node->'du_lieu','{}'::jsonb),
        NULLIF(v_node->>'created_by','')::uuid, COALESCE((v_node->>'created_at')::timestamptz, now()), now())
      ON CONFLICT (kind, ma) DO UPDATE
        SET ten = EXCLUDED.ten, don_vi_ma = EXCLUDED.don_vi_ma, du_lieu = EXCLUDED.du_lieu, updated_at = now();
    END IF;

  ELSIF r.loai = 'move_systems' THEN
    UPDATE public.dm_he_thong s
      SET nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid,
          linh_vuc_id = NULLIF(e->>'linh_vuc_id','')::uuid
      FROM jsonb_array_elements(COALESCE(snap->'he_thong','[]'::jsonb)) e
      WHERE s.id = (e->>'id')::uuid;
    UPDATE public.thiet_bi t
      SET nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid,
          linh_vuc_id = NULLIF(e->>'linh_vuc_id','')::uuid
      FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e
      WHERE t.id = (e->>'id')::uuid;

  ELSIF r.loai = 'move_device' THEN
    UPDATE public.thiet_bi t
      SET he_thong_id = NULLIF(e->>'he_thong_id','')::uuid,
          nhom_he_thong_id = NULLIF(e->>'nhom_he_thong_id','')::uuid,
          linh_vuc_id = NULLIF(e->>'linh_vuc_id','')::uuid
      FROM jsonb_array_elements(COALESCE(snap->'thiet_bi','[]'::jsonb)) e
      WHERE t.id = (e->>'id')::uuid;

  ELSIF r.loai = 'custom_fields' THEN
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong (id, he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu, created_by, created_at, updated_at)
    SELECT (e->>'id')::uuid, e->>'he_thong_id', e->>'field_key', e->>'nhan', COALESCE(e->>'kieu','text'),
           COALESCE(e->'tuy_chon','[]'::jsonb), COALESCE((e->>'thu_tu')::int,0),
           NULLIF(e->>'created_by','')::uuid, now(), now()
    FROM jsonb_array_elements(COALESCE(snap->'he_thong_truong','[]'::jsonb)) e;
  END IF;

  UPDATE public.cay_thay_doi SET da_hoan_tac = true, da_ap_dung = false, trang_thai = 'da_hoan_tac' WHERE id = _id;
  PERFORM public.log_app_event('cay_hoan_tac', 'cay_thay_doi', _id::text, jsonb_build_object('loai', r.loai));
  RETURN jsonb_build_object('ok', true);
END;
$fn$;

REVOKE ALL ON FUNCTION public._cay_apply(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cay_hoan_tac(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cay_submit_change(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cay_hoan_tac(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cay_submit_change(text, text, text, jsonb) TO authenticated;