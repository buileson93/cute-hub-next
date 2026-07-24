DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'cay_node_edit','thiet_bi','thiet_bi_tep_dinh_kem','giay_phep',
    'form_template','form_field','form_submission','form_submission_thiet_bi',
    'so_do_he_thong','so_do_tep_dinh_kem',
    'du_an','du_an_cong_viec','du_an_moc',
    'dm_don_vi','dm_he_thong','dm_nhom_he_thong','dm_vi_tri','dm_loai_thiet_bi',
    'dm_loai_giay_phep','dm_nha_cung_cap','dm_nha_san_xuat','dm_noi_cap','dm_trang_thai_thiet_bi'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS zz_audit_row ON public.%I', t);
      EXECUTE format(
        'CREATE TRIGGER zz_audit_row AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()',
        t
      );
    END IF;
  END LOOP;
END $$;