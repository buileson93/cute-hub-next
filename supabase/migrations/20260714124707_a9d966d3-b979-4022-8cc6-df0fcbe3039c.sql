
-- Bật realtime cho các bảng nghiệp vụ chính để mọi thay đổi CSDL đẩy về client ngay
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'thiet_bi','dm_he_thong','he_thong_thanh_phan',
    'lien_ket_he_thong','lien_ket_khe','gan_chuc_nang','gan_linh_kien',
    'su_co','hong_hoc','bao_tri','cong_viec_bao_tri','van_de','kiem_ke',
    'kho_giao_dich','kho','vat_tu','ban_giao','giay_phep','giay_phep_khai_thac',
    'form_submission','form_submission_item_result','form_submission_thiet_bi',
    'form_template','form_template_version','form_template_he_thong','form_section','form_field','form_check_item',
    'du_an','du_an_cong_viec','du_an_moc','du_an_cong_viec_phoi_hop',
    'thiet_bi_cap_phat','thiet_bi_ket_noi','thiet_bi_khe_linh_kien','thiet_bi_tep_dinh_kem','thiet_bi_vong_doi',
    'node_note','audit_log','anomaly_alert','canh_bao_het_han_log','cay_node_edit','cay_thay_doi',
    'so_do_he_thong','vi_tri_media','he_thong_truong',
    'dm_don_vi','dm_vi_tri','dm_nhom_he_thong','dm_loai_thiet_bi','dm_model',
    'dm_nha_san_xuat','dm_nha_cung_cap','dm_phan_loai','dm_linh_vuc','dm_loai_lien_ket',
    'dm_loai_giay_phep','dm_noi_cap','dm_to_chuc','dm_trang_thai_thiet_bi','dm_danh_gia_nien_han',
    'access_request','user_roles','user_scope','role_permission','profiles','tickets','ticket_comment'
  ]) LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t)
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
    -- REPLICA IDENTITY FULL để DELETE cũng có old-row đầy đủ cho phía client
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    END IF;
  END LOOP;
END $$;
