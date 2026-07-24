CREATE OR REPLACE FUNCTION public._cay_apply(_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.cay_thay_doi;
  snap jsonb := '{}'::jsonb;
  v_to_pl uuid;
  v_to_nh_key text;
  v_to_nh_ten text;
  v_nhom_id uuid;
  v_ids uuid[];
  v_dev_ma text;
  v_to_ht uuid;
  v_to_pl_dev uuid;
  v_ht_nhom uuid;
  v_ht_lv uuid;
  v_ht_pl uuid;
  v_scope text;
  v_pham_vi text;
BEGIN
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF r.da_ap_dung THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF r.loai = 'move_system' THEN
    v_to_pl := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');
    v_to_nh_ten := NULLIF(r.payload->>'to_nh_ten','');

    v_nhom_id := NULL;
    IF v_to_pl IS NOT NULL AND v_to_nh_key IS NOT NULL THEN
      SELECT id INTO v_nhom_id
        FROM public.dm_nhom_he_thong
        WHERE phan_loai_id = v_to_pl AND ma = v_to_nh_key
        LIMIT 1;
    END IF;

    SELECT jsonb_build_object(
      'he_thong', (SELECT jsonb_build_object('phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)
                    FROM public.dm_he_thong WHERE id = r.he_thong_id::uuid),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                    FROM public.thiet_bi WHERE he_thong_id = r.he_thong_id::uuid), '[]'::jsonb),
      'node_edit', (SELECT to_jsonb(n) FROM public.cay_node_edit n WHERE n.kind = 'ht' AND n.ma = r.he_thong_id)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET phan_loai_id = COALESCE(v_to_pl, phan_loai_id),
          nhom_he_thong_id = v_nhom_id
      WHERE id = r.he_thong_id::uuid;

  ELSIF r.loai = 'move_systems' THEN
    v_ids := ARRAY(SELECT jsonb_array_elements_text(COALESCE(r.payload->'ids','[]'::jsonb)))::uuid[];
    v_to_pl := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_nh_key := NULLIF(r.payload->>'to_nh_key','');

    v_nhom_id := NULL;
    IF v_to_pl IS NOT NULL AND v_to_nh_key IS NOT NULL THEN
      SELECT id INTO v_nhom_id
        FROM public.dm_nhom_he_thong
        WHERE phan_loai_id = v_to_pl AND ma = v_to_nh_key
        LIMIT 1;
    END IF;

    SELECT jsonb_build_object(
      'he_thong', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                    FROM public.dm_he_thong WHERE id = ANY(v_ids)), '[]'::jsonb),
      'thiet_bi', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'phan_loai_id', phan_loai_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id))
                    FROM public.thiet_bi WHERE he_thong_id = ANY(v_ids)), '[]'::jsonb)
    ) INTO snap;

    UPDATE public.dm_he_thong
      SET phan_loai_id = COALESCE(v_to_pl, phan_loai_id),
          nhom_he_thong_id = v_nhom_id
      WHERE id = ANY(v_ids);

  ELSIF r.loai = 'move_device' THEN
    v_dev_ma := r.payload->>'device_ma';
    v_to_ht := NULLIF(r.payload->>'to_ht_id','')::uuid;
    v_to_pl_dev := NULLIF(r.payload->>'to_pl_id','')::uuid;

    SELECT jsonb_build_object('thiet_bi',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'he_thong_id', he_thong_id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id, 'phan_loai_id', phan_loai_id))
       FROM public.thiet_bi WHERE ma_thiet_bi = v_dev_ma), '[]'::jsonb)) INTO snap;

    IF v_to_ht IS NOT NULL THEN
      SELECT nhom_he_thong_id, linh_vuc_id, phan_loai_id INTO v_ht_nhom, v_ht_lv, v_ht_pl
        FROM public.dm_he_thong WHERE id = v_to_ht;
      UPDATE public.thiet_bi
        SET he_thong_id = v_to_ht,
            nhom_he_thong_id = COALESCE(v_ht_nhom, nhom_he_thong_id),
            linh_vuc_id = COALESCE(v_ht_lv, linh_vuc_id),
            phan_loai_id = COALESCE(v_ht_pl, phan_loai_id)
        WHERE ma_thiet_bi = v_dev_ma;
    ELSIF v_to_pl_dev IS NOT NULL THEN
      UPDATE public.thiet_bi
        SET phan_loai_id = v_to_pl_dev,
            he_thong_id = NULL,
            nhom_he_thong_id = NULL
        WHERE ma_thiet_bi = v_dev_ma;
    ELSIF COALESCE((r.payload->>'detach')::boolean, false) THEN
      -- Gỡ thiết bị khỏi hệ thống → trở thành thiết bị độc lập (giữ phân loại).
      UPDATE public.thiet_bi
        SET he_thong_id = NULL,
            nhom_he_thong_id = NULL
        WHERE ma_thiet_bi = v_dev_ma;
    END IF;

  ELSIF r.loai = 'custom_fields' THEN
    v_scope := COALESCE(r.payload->>'scope','he_thong');
    v_pham_vi := CASE WHEN v_scope = 'thiet_bi' THEN 'thiet_bi' ELSE 'he_thong' END;

    SELECT jsonb_build_object('he_thong_truong',
      COALESCE((SELECT jsonb_agg(to_jsonb(t)) FROM public.he_thong_truong t WHERE t.he_thong_id = r.he_thong_id), '[]'::jsonb)
    ) INTO snap;
    DELETE FROM public.he_thong_truong WHERE he_thong_id = r.he_thong_id;
    INSERT INTO public.he_thong_truong
      (he_thong_id, field_key, nhan, kieu, tuy_chon, thu_tu,
       help_text, bat_buoc, rang_buoc, mac_dinh, nhom_field,
       pham_vi, ap_dung_lop, ap_dung_id, hoat_dong, created_by)
    SELECT r.he_thong_id, f->>'field_key', f->>'nhan', COALESCE(f->>'kieu','text'),
           COALESCE(f->'tuy_chon','[]'::jsonb), COALESCE((f->>'thu_tu')::int, 0),
           NULLIF(f->>'help_text',''),
           COALESCE((f->>'bat_buoc')::boolean, false),
           COALESCE(f->'rang_buoc','{}'::jsonb),
           CASE WHEN f ? 'mac_dinh' AND f->'mac_dinh' <> 'null'::jsonb THEN f->'mac_dinh' ELSE NULL END,
           NULLIF(f->>'nhom_field',''),
           v_pham_vi, 'thiet_bi', r.he_thong_id, true,
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