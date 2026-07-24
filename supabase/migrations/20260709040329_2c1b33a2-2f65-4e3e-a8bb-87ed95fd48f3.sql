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
BEGIN
  SELECT * INTO r FROM public.cay_thay_doi WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Khong tim thay thay doi'; END IF;
  IF r.da_ap_dung THEN RETURN jsonb_build_object('ok', true, 'noop', true); END IF;

  IF r.loai = 'move_system' THEN
    v_to_nhom := NULLIF(r.payload->>'to_nhom_id','')::uuid;
    v_to_lv := NULLIF(r.payload->>'to_lv_id','')::uuid;
    SELECT jsonb_build_object(
      'he_thong', (SELECT jsonb_build_object('nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)
                   FROM public.dm_he_thong WHERE id = r.he_thong_id::uuid),
      'thiet_bi', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'nhom_he_thong_id', nhom_he_thong_id, 'linh_vuc_id', linh_vuc_id)), '[]'::jsonb)
                   FROM public.thiet_bi WHERE he_thong_id = r.he_thong_id::uuid)
    ) INTO snap;
    UPDATE public.dm_he_thong
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE id = r.he_thong_id::uuid;
    UPDATE public.thiet_bi
      SET nhom_he_thong_id = COALESCE(v_to_nhom, nhom_he_thong_id),
          linh_vuc_id = COALESCE(v_to_lv, linh_vuc_id)
      WHERE he_thong_id = r.he_thong_id::uuid;

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
REVOKE ALL ON FUNCTION public._cay_apply(uuid) FROM PUBLIC, anon;
-- migration end