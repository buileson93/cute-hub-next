CREATE OR REPLACE FUNCTION public._cay_apply(_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    INSERT INTO public.he_thong_truong
      (he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu,
       help_text, bat_buoc, rang_buoc, mac_dinh, nhom_field, created_by)
    SELECT r.he_thong_id, f->>'field_key', f->>'nhan', COALESCE(f->>'kieu','text'),
           COALESCE(f->'tuy_chon','[]'::jsonb), COALESCE((f->>'thu_tu')::int, 0),
           NULLIF(f->>'help_text',''),
           COALESCE((f->>'bat_buoc')::boolean, false),
           COALESCE(f->'rang_buoc','{}'::jsonb),
           CASE WHEN f ? 'mac_dinh' AND f->'mac_dinh' <> 'null'::jsonb THEN f->'mac_dinh' ELSE NULL END,
           NULLIF(f->>'nhom_field',''),
           r.nguoi_tao
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
$function$;