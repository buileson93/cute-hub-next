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
  IF _loai NOT IN ('move_system','custom_fields') THEN RAISE EXCEPTION 'Loai thay doi khong hop le'; END IF;

  INSERT INTO public.cay_thay_doi(loai, he_thong_id, mo_ta, payload, trang_thai, nguoi_tao)
  VALUES (_loai, _he_thong_id, _mo_ta, COALESCE(_payload, '{}'::jsonb),
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

CREATE OR REPLACE FUNCTION public.cay_duyet(_id uuid, _approve boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'Chi admin moi duyet thay doi'; END IF;
  IF _approve THEN
    PERFORM public._cay_apply(_id);
    UPDATE public.cay_thay_doi SET nguoi_duyet = auth.uid(), duyet_luc = now() WHERE id = _id;
    PERFORM public.log_app_event('cay_duyet', 'cay_thay_doi', _id::text, '{}'::jsonb);
  ELSE
    UPDATE public.cay_thay_doi SET trang_thai = 'tu_choi', nguoi_duyet = auth.uid(), duyet_luc = now() WHERE id = _id;
    PERFORM public.log_app_event('cay_tu_choi', 'cay_thay_doi', _id::text, '{}'::jsonb);
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.cay_hoan_tac(_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE r public.cay_thay_doi; snap jsonb; v_ht jsonb;
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

REVOKE ALL ON FUNCTION public.cay_submit_change(text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cay_duyet(uuid, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cay_hoan_tac(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cay_submit_change(text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cay_duyet(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cay_hoan_tac(uuid) TO authenticated;
-- migration end