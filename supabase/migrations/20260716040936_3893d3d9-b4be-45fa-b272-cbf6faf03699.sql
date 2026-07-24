
-- Whitelist of tables allowed for bulk import
CREATE OR REPLACE FUNCTION public._backup_allowed_table(p_table text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_table = ANY (ARRAY[
    'profiles','user_roles','role_permission','user_scope',
    'dm_don_vi','dm_he_thong','dm_vi_tri','dm_loai_thiet_bi','dm_nha_san_xuat',
    'dm_nha_cung_cap','dm_dac_tinh','dm_phan_loai','dm_linh_vuc','dm_nhom_he_thong',
    'dm_to_chuc','dm_loai_giay_phep','dm_loai_lien_ket','dm_trang_thai_thiet_bi',
    'dm_noi_cap','dm_danh_gia_nien_han','dm_model','dm_model_dac_tinh',
    'thiet_bi','he_thong_thanh_phan','thiet_bi_khe_linh_kien','gan_linh_kien',
    'gan_chuc_nang','lien_ket_he_thong','lien_ket_khe',
    'su_co','bao_tri','hong_hoc','kiem_ke','chung_chi_thiet_bi','ban_giao',
    'giay_phep','giay_phep_khai_thac','cong_viec_bao_tri','van_de','tickets',
    'ticket_comment',
    'form_template','form_section','form_field','form_check_item',
    'form_submission','form_submission_item_result','form_template_version',
    'form_template_he_thong','form_template_include','form_submission_thiet_bi',
    'field_set','field_set_item',
    'import_batch','import_item','import_alias',
    'audit_log','backup_lich_su','cay_thay_doi','cay_node_edit',
    'notifications','telegram_subscriber','telegram_da_gui',
    'ai_config','ai_conversation','ai_message','search_index','node_note',
    'so_do_he_thong','so_do_tep_dinh_kem','so_do_thu_vien_hinh',
    'vat_tu','kho','kho_giao_dich','thiet_bi_cap_phat','thiet_bi_do_dac',
    'thiet_bi_ket_noi','thiet_bi_tep_dinh_kem','thiet_bi_vong_doi',
    'nhan_vien','du_an','du_an_cong_viec','du_an_cong_viec_phoi_hop','du_an_moc',
    'bao_tri_chinh_sach','anomaly_alert','app_cai_dat','dinh_nghia_truong',
    'he_thong_truong','bang_cot_tuy_chinh','canh_bao_het_han_log',
    'auth_event_log','audit_log','feature_usage_log','access_request',
    'conversations','conversation_participant','messages','webauthn_credentials',
    'model_tai_lieu','vi_tri_media'
  ]);
$$;

-- Bulk import rows into a whitelisted public table
CREATE OR REPLACE FUNCTION public.admin_import_rows(
  p_table text,
  p_rows jsonb
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF NOT public._backup_allowed_table(p_table) THEN
    RAISE EXCEPTION 'Table % is not allowed for import', p_table;
  END IF;
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' OR jsonb_array_length(p_rows) = 0 THEN
    RETURN 0;
  END IF;

  -- Bypass triggers/FK checks in this transaction only
  PERFORM set_config('session_replication_role', 'replica', true);

  EXECUTE format(
    'INSERT INTO public.%1$I SELECT * FROM jsonb_populate_recordset(NULL::public.%1$I, $1) ON CONFLICT DO NOTHING',
    p_table
  ) USING p_rows;
  GET DIAGNOSTICS n = ROW_COUNT;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_import_rows(text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_import_rows(text, jsonb) TO authenticated;

-- Reset all sequences in the public schema based on current MAX(column)
CREATE OR REPLACE FUNCTION public.admin_reset_sequences()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  cnt integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  FOR r IN
    SELECT
      n.nspname || '.' || c.relname                             AS seq_fqname,
      (dep.refobjid::regclass)::text                            AS tbl_fqname,
      a.attname                                                 AS col_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_depend dep  ON dep.objid = c.oid AND dep.deptype = 'a'
    JOIN pg_attribute a ON a.attrelid = dep.refobjid AND a.attnum = dep.refobjsubid
    WHERE c.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format(
      'SELECT setval(%L, GREATEST(COALESCE((SELECT MAX(%I) FROM %s), 0), 1), true)',
      r.seq_fqname, r.col_name, r.tbl_fqname
    );
    cnt := cnt + 1;
  END LOOP;

  RETURN cnt;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reset_sequences() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_sequences() TO authenticated;
