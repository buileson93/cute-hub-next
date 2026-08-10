CREATE OR REPLACE FUNCTION public.approve_change_request(p_id uuid, p_ly_do text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.change_request%ROWTYPE;
  v_pl  jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE='28000'; END IF;
  IF NOT public.has_role(v_uid,'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE='42501';
  END IF;

  SELECT * INTO v_row FROM public.change_request WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found' USING ERRCODE='P0002'; END IF;
  IF v_row.nguoi_tao = v_uid THEN RAISE EXCEPTION 'self_approve_forbidden' USING ERRCODE='42501'; END IF;
  IF v_row.trang_thai <> 'pending' THEN RAISE EXCEPTION 'invalid_state' USING ERRCODE='22023'; END IF;

  v_pl := v_row.payload;

  BEGIN
    IF v_row.loai = 'danh_muc.merge' THEN
      PERFORM public.merge_danh_muc(
        (v_pl->>'entity')::text,
        (v_pl->>'keep_id')::uuid,
        (v_pl->>'drop_id')::uuid,
        p_ly_do
      );

    ELSIF v_row.loai = 'danh_muc.deactivate' THEN
      EXECUTE format('UPDATE public.%I SET active = false WHERE id = $1', v_pl->>'entity')
        USING (v_pl->>'id')::uuid;

    ELSIF v_row.loai = 'role.grant' THEN
      INSERT INTO public.user_roles(user_id, role)
      VALUES ((v_pl->>'user_id')::uuid, (v_pl->>'role')::app_role)
      ON CONFLICT (user_id, role) DO NOTHING;

    ELSIF v_row.loai = 'role.revoke' THEN
      DELETE FROM public.user_roles
       WHERE user_id = (v_pl->>'user_id')::uuid
         AND role = (v_pl->>'role')::app_role;

    ELSIF v_row.loai = 'thiet_bi.change_don_vi' THEN
      UPDATE public.thiet_bi
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'thiet_bi_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_nhom' THEN
      UPDATE public.dm_he_thong
         SET nhom_he_thong_id = (v_pl->>'to_nhom_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    ELSIF v_row.loai = 'he_thong.change_don_vi' THEN
      UPDATE public.dm_he_thong
         SET don_vi_id = (v_pl->>'to_don_vi_id')::uuid
       WHERE id = (v_pl->>'he_thong_id')::uuid;

    -- NEW: Propose field update support
    ELSIF v_row.loai = 'thiet_bi.propose_field' THEN
      EXECUTE format('UPDATE public.thiet_bi SET %I = $1 WHERE id = $2', v_pl->>'field')
        USING (v_pl->>'value'), (v_pl->>'thiet_bi_id')::uuid;
        
    ELSIF v_row.loai = 'he_thong.propose_field' THEN
      EXECUTE format('UPDATE public.dm_he_thong SET %I = $1 WHERE id = $2', v_pl->>'field')
        USING (v_pl->>'value'), (v_pl->>'he_thong_id')::uuid;

    ELSE
      RAISE EXCEPTION 'loai_not_supported: %', v_row.loai USING ERRCODE='0A000';
    END IF;

    UPDATE public.change_request
       SET trang_thai='approved',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now()
     WHERE id = p_id;

    RETURN p_id;

  EXCEPTION WHEN OTHERS THEN
    UPDATE public.change_request
       SET trang_thai='applied_failed',
           ly_do = NULLIF(btrim(coalesce(p_ly_do,'')),''),
           resolved_by=v_uid, resolved_at=now(),
           error_message = SQLERRM
     WHERE id = p_id;
    RAISE;
  END;
END $function$;
