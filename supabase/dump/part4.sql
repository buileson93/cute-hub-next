SET search_path = public, pg_catalog;
--
-- Name: app_cai_dat app_cai_dat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_cai_dat
    ADD CONSTRAINT app_cai_dat_pkey PRIMARY KEY (khoa);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: auth_event_log auth_event_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_event_log
    ADD CONSTRAINT auth_event_log_pkey PRIMARY KEY (id);


--
-- Name: backup_lich_su backup_lich_su_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_lich_su
    ADD CONSTRAINT backup_lich_su_pkey PRIMARY KEY (id);


--
-- Name: ban_giao ban_giao_ma_ban_giao_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ban_giao
    ADD CONSTRAINT ban_giao_ma_ban_giao_key UNIQUE (ma_ban_giao);


--
-- Name: ban_giao ban_giao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ban_giao
    ADD CONSTRAINT ban_giao_pkey PRIMARY KEY (id);


--
-- Name: bang_cot_tuy_chinh bang_cot_tuy_chinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bang_cot_tuy_chinh
    ADD CONSTRAINT bang_cot_tuy_chinh_pkey PRIMARY KEY (id);


--
-- Name: bang_cot_tuy_chinh bang_cot_tuy_chinh_user_id_bang_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bang_cot_tuy_chinh
    ADD CONSTRAINT bang_cot_tuy_chinh_user_id_bang_key_key UNIQUE (user_id, bang_key);


--
-- Name: bao_cao_annotation bao_cao_annotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_pkey PRIMARY KEY (id);


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_pkey PRIMARY KEY (id);


--
-- Name: bao_tri bao_tri_ma_bao_tri_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri
    ADD CONSTRAINT bao_tri_ma_bao_tri_key UNIQUE (ma_bao_tri);


--
-- Name: bao_tri bao_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri
    ADD CONSTRAINT bao_tri_pkey PRIMARY KEY (id);


--
-- Name: canh_bao_het_han_log canh_bao_het_han_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.canh_bao_het_han_log
    ADD CONSTRAINT canh_bao_het_han_log_pkey PRIMARY KEY (id);


--
-- Name: cay_node_edit cay_node_edit_kind_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_node_edit
    ADD CONSTRAINT cay_node_edit_kind_ma_key UNIQUE (kind, ma);


--
-- Name: cay_node_edit cay_node_edit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_node_edit
    ADD CONSTRAINT cay_node_edit_pkey PRIMARY KEY (id);


--
-- Name: cay_thay_doi cay_thay_doi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cay_thay_doi
    ADD CONSTRAINT cay_thay_doi_pkey PRIMARY KEY (id);


--
-- Name: change_request change_request_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_pkey PRIMARY KEY (id);


--
-- Name: chung_chi_thiet_bi chung_chi_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chung_chi_thiet_bi
    ADD CONSTRAINT chung_chi_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_ma_cong_viec_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_ma_cong_viec_key UNIQUE (ma_cong_viec);


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_pkey PRIMARY KEY (id);


--
-- Name: conversation_participant conversation_participant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participant
    ADD CONSTRAINT conversation_participant_pkey PRIMARY KEY (conversation_id, user_id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: dinh_nghia_truong dinh_nghia_truong_ap_dung_cho_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dinh_nghia_truong
    ADD CONSTRAINT dinh_nghia_truong_ap_dung_cho_key_key UNIQUE (ap_dung_cho, key);


--
-- Name: dinh_nghia_truong dinh_nghia_truong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dinh_nghia_truong
    ADD CONSTRAINT dinh_nghia_truong_pkey PRIMARY KEY (id);


--
-- Name: dm_dac_tinh dm_dac_tinh_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_ma_key UNIQUE (ma);


--
-- Name: dm_dac_tinh dm_dac_tinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_pkey PRIMARY KEY (id);


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_ma_key UNIQUE (ma);


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_pkey PRIMARY KEY (id);


--
-- Name: dm_don_vi dm_don_vi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_ma_key UNIQUE (ma);


--
-- Name: dm_don_vi dm_don_vi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_pkey PRIMARY KEY (id);


--
-- Name: dm_he_thong dm_he_thong_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_ma_key UNIQUE (ma);


--
-- Name: dm_he_thong dm_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_ma_key UNIQUE (ma);


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_ma_key UNIQUE (ma);


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_pkey PRIMARY KEY (id);


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_ma_key UNIQUE (ma);


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_pkey PRIMARY KEY (model_id, dac_tinh_id);


--
-- Name: dm_model dm_model_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_pkey PRIMARY KEY (id);


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_ma_key UNIQUE (ma);


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_pkey PRIMARY KEY (id);


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_ma_key UNIQUE (ma);


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_pkey PRIMARY KEY (id);


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_ma_key UNIQUE (ma);


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_pkey PRIMARY KEY (id);


--
-- Name: dm_noi_cap dm_noi_cap_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_ma_key UNIQUE (ma);


--
-- Name: dm_noi_cap dm_noi_cap_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_pkey PRIMARY KEY (id);


--
-- Name: dm_phan_loai dm_phan_loai_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_ma_key UNIQUE (ma);


--
-- Name: dm_phan_loai dm_phan_loai_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_pkey PRIMARY KEY (id);


--
-- Name: dm_to_chuc dm_to_chuc_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_ma_key UNIQUE (ma);


--
-- Name: dm_to_chuc dm_to_chuc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_pkey PRIMARY KEY (id);


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_ma_key UNIQUE (ma);


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: dm_vi_tri dm_vi_tri_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_ma_key UNIQUE (ma);


--
-- Name: dm_vi_tri dm_vi_tri_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_pkey PRIMARY KEY (id);


--
-- Name: du_an_cong_viec_phoi_hop du_an_cong_viec_phoi_hop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec_phoi_hop
    ADD CONSTRAINT du_an_cong_viec_phoi_hop_pkey PRIMARY KEY (cong_viec_id, user_id);


--
-- Name: du_an_cong_viec du_an_cong_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_pkey PRIMARY KEY (id);


--
-- Name: du_an du_an_ma_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_ma_key UNIQUE (ma);


--
-- Name: du_an_moc du_an_moc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_moc
    ADD CONSTRAINT du_an_moc_pkey PRIMARY KEY (id);


--
-- Name: du_an du_an_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_pkey PRIMARY KEY (id);


--
-- Name: feature_usage_log feature_usage_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feature_usage_log
    ADD CONSTRAINT feature_usage_log_pkey PRIMARY KEY (id);


--
-- Name: field_set_item field_set_item_field_set_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_field_set_id_field_key_key UNIQUE (field_set_id, field_key);


--
-- Name: field_set_item field_set_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_pkey PRIMARY KEY (id);


--
-- Name: field_set field_set_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set
    ADD CONSTRAINT field_set_pkey PRIMARY KEY (id);


--
-- Name: form_check_item form_check_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_pkey PRIMARY KEY (id);


--
-- Name: form_check_item form_check_item_template_id_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_template_id_item_code_key UNIQUE (template_id, item_code);


--
-- Name: form_field form_field_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_pkey PRIMARY KEY (id);


--
-- Name: form_field form_field_template_id_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_template_id_key_key UNIQUE (template_id, key);


--
-- Name: form_section form_section_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_pkey PRIMARY KEY (id);


--
-- Name: form_section form_section_template_id_ma_section_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_template_id_ma_section_key UNIQUE (template_id, ma_section);


--
-- Name: form_sign_otp form_sign_otp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_pkey PRIMARY KEY (id);


--
-- Name: form_submission_item_result form_submission_item_result_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_pkey PRIMARY KEY (id);


--
-- Name: form_submission_item_result form_submission_item_result_submission_id_item_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_submission_id_item_code_key UNIQUE (submission_id, item_code);


--
-- Name: form_submission form_submission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_pkey PRIMARY KEY (id);


--
-- Name: form_submission_signature form_submission_signature_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_pkey PRIMARY KEY (id);


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_pkey PRIMARY KEY (submission_id, thiet_bi_id);


--
-- Name: form_template form_template_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template
    ADD CONSTRAINT form_template_code_key UNIQUE (code);


--
-- Name: form_template_he_thong form_template_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_pkey PRIMARY KEY (id);


--
-- Name: form_template_he_thong form_template_he_thong_template_id_he_thong_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_template_id_he_thong_id_key UNIQUE (template_id, he_thong_id);


--
-- Name: form_template_include form_template_include_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_pkey PRIMARY KEY (id);


--
-- Name: form_template form_template_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template
    ADD CONSTRAINT form_template_pkey PRIMARY KEY (id);


--
-- Name: form_template_version form_template_version_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_pkey PRIMARY KEY (id);


--
-- Name: form_template_version form_template_version_template_id_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_template_id_version_key UNIQUE (template_id, version);


--
-- Name: form_template_include ftinc_unique_child; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT ftinc_unique_child UNIQUE (parent_version_id, child_version_id);


--
-- Name: gan_chuc_nang gan_chuc_nang_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_pkey PRIMARY KEY (id);


--
-- Name: gan_linh_kien gan_linh_kien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_pkey PRIMARY KEY (id);


--
-- Name: giay_phep_khai_thac giay_phep_khai_thac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep_khai_thac
    ADD CONSTRAINT giay_phep_khai_thac_pkey PRIMARY KEY (id);


--
-- Name: giay_phep giay_phep_ma_giay_phep_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_ma_giay_phep_key UNIQUE (ma_giay_phep);


--
-- Name: giay_phep giay_phep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_pkey PRIMARY KEY (id);


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_he_thong_id_ma_thanh_phan_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_he_thong_id_ma_thanh_phan_key UNIQUE (he_thong_id, ma_thanh_phan);


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_pkey PRIMARY KEY (id);


--
-- Name: he_thong_truong he_thong_truong_he_thong_id_field_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_truong
    ADD CONSTRAINT he_thong_truong_he_thong_id_field_key_key UNIQUE (he_thong_id, field_key);


--
-- Name: he_thong_truong he_thong_truong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_truong
    ADD CONSTRAINT he_thong_truong_pkey PRIMARY KEY (id);


--
-- Name: hong_hoc hong_hoc_ma_hong_hoc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hong_hoc
    ADD CONSTRAINT hong_hoc_ma_hong_hoc_key UNIQUE (ma_hong_hoc);


--
-- Name: hong_hoc hong_hoc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hong_hoc
    ADD CONSTRAINT hong_hoc_pkey PRIMARY KEY (id);


--
-- Name: import_alias import_alias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_alias
    ADD CONSTRAINT import_alias_pkey PRIMARY KEY (id);


--
-- Name: import_batch import_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_batch
    ADD CONSTRAINT import_batch_pkey PRIMARY KEY (id);


--
-- Name: import_item import_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_item
    ADD CONSTRAINT import_item_pkey PRIMARY KEY (id);


--
-- Name: kho_giao_dich kho_giao_dich_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_pkey PRIMARY KEY (id);


--
-- Name: kho kho_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_pkey PRIMARY KEY (id);


--
-- Name: kiem_ke kiem_ke_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kiem_ke
    ADD CONSTRAINT kiem_ke_pkey PRIMARY KEY (id);


--
-- Name: lien_ket_he_thong lien_ket_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_pkey PRIMARY KEY (id);


--
-- Name: lien_ket_khe lien_ket_khe_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: model_tai_lieu model_tai_lieu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_tai_lieu
    ADD CONSTRAINT model_tai_lieu_pkey PRIMARY KEY (id);


--
-- Name: nhan_vien nhan_vien_ma_nhan_vien_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhan_vien
    ADD CONSTRAINT nhan_vien_ma_nhan_vien_key UNIQUE (ma_nhan_vien);


--
-- Name: nhan_vien nhan_vien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nhan_vien
    ADD CONSTRAINT nhan_vien_pkey PRIMARY KEY (id);


--
-- Name: node_note node_note_node_type_node_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.node_note
    ADD CONSTRAINT node_note_node_type_node_id_key UNIQUE (node_type, node_id);


--
-- Name: node_note node_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.node_note
    ADD CONSTRAINT node_note_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pm_cong_viec pm_cong_viec_chinh_sach_id_doi_tuong_id_ky_hieu_han_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_chinh_sach_id_doi_tuong_id_ky_hieu_han_key UNIQUE (chinh_sach_id, doi_tuong_id, ky_hieu_han);


--
-- Name: pm_cong_viec pm_cong_viec_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: role_permission role_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permission
    ADD CONSTRAINT role_permission_pkey PRIMARY KEY (role, module, action);


--
-- Name: search_index search_index_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_index
    ADD CONSTRAINT search_index_pkey PRIMARY KEY (loai, id);


--
-- Name: so_do_he_thong so_do_he_thong_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_he_thong
    ADD CONSTRAINT so_do_he_thong_pkey PRIMARY KEY (id);


--
-- Name: so_do_tep_dinh_kem so_do_tep_dinh_kem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_tep_dinh_kem
    ADD CONSTRAINT so_do_tep_dinh_kem_pkey PRIMARY KEY (id);


--
-- Name: so_do_thu_vien_hinh so_do_thu_vien_hinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_thu_vien_hinh
    ADD CONSTRAINT so_do_thu_vien_hinh_pkey PRIMARY KEY (id);


--
-- Name: su_co_lich_su su_co_lich_su_doi_tuong_bang_doi_tuong_id_buoc_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co_lich_su
    ADD CONSTRAINT su_co_lich_su_doi_tuong_bang_doi_tuong_id_buoc_key UNIQUE (doi_tuong_bang, doi_tuong_id, buoc);


--
-- Name: su_co_lich_su su_co_lich_su_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co_lich_su
    ADD CONSTRAINT su_co_lich_su_pkey PRIMARY KEY (id);


--
-- Name: su_co su_co_ma_su_co_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co
    ADD CONSTRAINT su_co_ma_su_co_key UNIQUE (ma_su_co);


--
-- Name: su_co su_co_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.su_co
    ADD CONSTRAINT su_co_pkey PRIMARY KEY (id);


--
-- Name: system_signing_key system_signing_key_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_signing_key
    ADD CONSTRAINT system_signing_key_pkey PRIMARY KEY (id);


--
-- Name: telegram_da_gui telegram_da_gui_loai_ref_id_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_da_gui
    ADD CONSTRAINT telegram_da_gui_loai_ref_id_chat_id_key UNIQUE (loai, ref_id, chat_id);


--
-- Name: telegram_da_gui telegram_da_gui_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_da_gui
    ADD CONSTRAINT telegram_da_gui_pkey PRIMARY KEY (id);


--
-- Name: telegram_subscriber telegram_subscriber_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_subscriber
    ADD CONSTRAINT telegram_subscriber_chat_id_key UNIQUE (chat_id);


--
-- Name: telegram_subscriber telegram_subscriber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telegram_subscriber
    ADD CONSTRAINT telegram_subscriber_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_do_dac
    ADD CONSTRAINT thiet_bi_do_dac_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_thiet_bi_id_ma_khe_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_thiet_bi_id_ma_khe_key UNIQUE (thiet_bi_id, ma_khe);


--
-- Name: thiet_bi thiet_bi_ma_thiet_bi_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_ma_thiet_bi_key UNIQUE (ma_thiet_bi);


--
-- Name: thiet_bi thiet_bi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_tep_dinh_kem thiet_bi_tep_dinh_kem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_tep_dinh_kem
    ADD CONSTRAINT thiet_bi_tep_dinh_kem_pkey PRIMARY KEY (id);


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_pkey PRIMARY KEY (id);


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_cau_hinh
    ADD CONSTRAINT thong_bao_cau_hinh_pkey PRIMARY KEY (id);


--
-- Name: thong_bao_email_queue thong_bao_email_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_email_queue
    ADD CONSTRAINT thong_bao_email_queue_pkey PRIMARY KEY (id);


--
-- Name: thong_bao thong_bao_khoa_chong_trung_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_khoa_chong_trung_key UNIQUE (khoa_chong_trung);


--
-- Name: thong_bao thong_bao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_pkey PRIMARY KEY (id);


--
-- Name: ticket_comment ticket_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comment
    ADD CONSTRAINT ticket_comment_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: user_layout_prefs user_layout_prefs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_layout_prefs
    ADD CONSTRAINT user_layout_prefs_pkey PRIMARY KEY (user_id, key);


--
-- Name: user_pinned user_pinned_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_pinned
    ADD CONSTRAINT user_pinned_pkey PRIMARY KEY (user_id, path);


--
-- Name: user_recent user_recent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent
    ADD CONSTRAINT user_recent_pkey PRIMARY KEY (user_id, path);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: user_scope user_scope_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_pkey PRIMARY KEY (id);


--
-- Name: van_de van_de_ma_van_de_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_ma_van_de_key UNIQUE (ma_van_de);


--
-- Name: van_de van_de_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_pkey PRIMARY KEY (id);


--
-- Name: vat_tu vat_tu_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_pkey PRIMARY KEY (id);


--
-- Name: vi_tri_media vi_tri_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vi_tri_media
    ADD CONSTRAINT vi_tri_media_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_credential_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_credential_id_key UNIQUE (credential_id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: ai_conversation_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_conversation_user_idx ON public.ai_conversation USING btree (user_id, updated_at DESC);


--
-- Name: ai_message_conv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ai_message_conv_idx ON public.ai_message USING btree (conversation_id, created_at);


--
-- Name: anomaly_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX anomaly_status_idx ON public.anomaly_alert USING btree (status, created_at DESC);


--
-- Name: audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_created_at_idx ON public.audit_log USING btree (created_at DESC);


--
-- Name: audit_log_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_entity_idx ON public.audit_log USING btree (entity, created_at DESC);


--
-- Name: audit_log_severity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_severity_idx ON public.audit_log USING btree (severity, created_at DESC);


--
-- Name: audit_log_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_id_idx ON public.audit_log USING btree (user_id);


--
-- Name: audit_log_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_log_user_idx ON public.audit_log USING btree (user_id, created_at DESC);


--
-- Name: auth_event_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX auth_event_user_idx ON public.auth_event_log USING btree (user_id, created_at DESC);


--
-- Name: ban_giao_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ban_giao_thiet_bi_id_idx ON public.ban_giao USING btree (thiet_bi_id);


--
-- Name: bao_tri_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bao_tri_thanh_phan_id_idx ON public.bao_tri USING btree (thanh_phan_id);


--
-- Name: bao_tri_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bao_tri_thiet_bi_id_idx ON public.bao_tri USING btree (thiet_bi_id);


--
-- Name: dm_dac_tinh_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_dac_tinh_merged_into_idx ON public.dm_dac_tinh USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_danh_gia_nien_han_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_danh_gia_nien_han_merged_into_idx ON public.dm_danh_gia_nien_han USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_don_vi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_don_vi_merged_into_idx ON public.dm_don_vi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_he_thong_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_he_thong_merged_into_idx ON public.dm_he_thong USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_giay_phep_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_giay_phep_merged_into_idx ON public.dm_loai_giay_phep USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_lien_ket_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_lien_ket_merged_into_idx ON public.dm_loai_lien_ket USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_loai_thiet_bi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_loai_thiet_bi_merged_into_idx ON public.dm_loai_thiet_bi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_model_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_model_merged_into_idx ON public.dm_model USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nha_cung_cap_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nha_cung_cap_merged_into_idx ON public.dm_nha_cung_cap USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nha_san_xuat_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nha_san_xuat_merged_into_idx ON public.dm_nha_san_xuat USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_nhom_he_thong_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_nhom_he_thong_merged_into_idx ON public.dm_nhom_he_thong USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_noi_cap_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_noi_cap_merged_into_idx ON public.dm_noi_cap USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_phan_loai_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_phan_loai_merged_into_idx ON public.dm_phan_loai USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_to_chuc_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_to_chuc_merged_into_idx ON public.dm_to_chuc USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_trang_thai_thiet_bi_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_trang_thai_thiet_bi_merged_into_idx ON public.dm_trang_thai_thiet_bi USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: dm_vi_tri_merged_into_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX dm_vi_tri_merged_into_idx ON public.dm_vi_tri USING btree (merged_into) WHERE (merged_into IS NOT NULL);


--
-- Name: feature_usage_feat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_usage_feat_idx ON public.feature_usage_log USING btree (feature, created_at DESC);


--
-- Name: feature_usage_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX feature_usage_user_idx ON public.feature_usage_log USING btree (user_id, created_at DESC);


--
-- Name: form_field_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_field_template_idx ON public.form_field USING btree (template_id, "position");


--
-- Name: form_sub_tb_thiet_bi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_sub_tb_thiet_bi_idx ON public.form_submission_thiet_bi USING btree (thiet_bi_id);


--
-- Name: form_submission_created_by_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_created_by_idx ON public.form_submission USING btree (created_by, created_at DESC);


--
-- Name: form_submission_don_vi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_don_vi_idx ON public.form_submission USING btree (don_vi_id, status);


--
-- Name: form_submission_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_search_trgm_idx ON public.form_submission USING gin (search_text public.gin_trgm_ops);


--
-- Name: form_submission_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_search_tsv_idx ON public.form_submission USING gin (search_tsv);


--
-- Name: form_submission_template_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_template_idx ON public.form_submission USING btree (template_id, status, created_at DESC);


--
-- Name: form_submission_thiet_bi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_submission_thiet_bi_idx ON public.form_submission USING btree (thiet_bi_id);


--
-- Name: form_template_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX form_template_active_idx ON public.form_template USING btree (active, code);


--
-- Name: giay_phep_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX giay_phep_search_trgm_idx ON public.giay_phep USING gin (search_text public.gin_trgm_ops);


--
-- Name: giay_phep_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX giay_phep_search_tsv_idx ON public.giay_phep USING gin (search_tsv);


--
-- Name: he_thong_thanh_phan_deleted_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX he_thong_thanh_phan_deleted_at_idx ON public.he_thong_thanh_phan USING btree (deleted_at) WHERE (deleted_at IS NOT NULL);


--
-- Name: hong_hoc_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hong_hoc_thanh_phan_id_idx ON public.hong_hoc USING btree (thanh_phan_id);


--
-- Name: hong_hoc_thiet_bi_hong_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX hong_hoc_thiet_bi_hong_id_idx ON public.hong_hoc USING btree (thiet_bi_hong_id);


--
-- Name: idx_audit_log_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_created ON public.audit_log USING btree (created_at DESC);


--
-- Name: idx_audit_log_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_log_user_created ON public.audit_log USING btree (user_id, created_at DESC);


--
-- Name: idx_ban_giao_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ban_giao_ngay ON public.ban_giao USING btree (ngay_nhan DESC);


--
-- Name: idx_bao_cao_annotation_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_cao_annotation_he_thong ON public.bao_cao_annotation USING btree (he_thong_id);


--
-- Name: idx_bao_cao_annotation_thoi_diem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_cao_annotation_thoi_diem ON public.bao_cao_annotation USING btree (thoi_diem);


--
-- Name: idx_bao_tri_chinh_sach_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_chinh_sach_loai ON public.bao_tri_chinh_sach USING btree (loai_thiet_bi_id);


--
-- Name: idx_bao_tri_chinh_sach_nguoi_phu_trach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_chinh_sach_nguoi_phu_trach_id ON public.bao_tri_chinh_sach USING btree (nguoi_phu_trach_id);


--
-- Name: idx_bao_tri_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_ngay ON public.bao_tri USING btree (ngay_bat_dau DESC);


--
-- Name: idx_bao_tri_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bao_tri_trang_thai ON public.bao_tri USING btree (trang_thai);


--
-- Name: idx_change_request_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_created_at ON public.change_request USING btree (created_at DESC);


--
-- Name: idx_change_request_nguoi_tao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_nguoi_tao ON public.change_request USING btree (nguoi_tao);


--
-- Name: idx_change_request_pending; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_change_request_pending ON public.change_request USING btree (trang_thai) WHERE (trang_thai = 'pending'::public.change_request_status);


--
-- Name: idx_chung_chi_het_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chung_chi_het_han ON public.chung_chi_thiet_bi USING btree (ngay_het_han);


--
-- Name: idx_chung_chi_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chung_chi_tb ON public.chung_chi_thiet_bi USING btree (thiet_bi_id);


--
-- Name: idx_cong_viec_bao_tri_bao_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_bao_tri_id ON public.cong_viec_bao_tri USING btree (bao_tri_id);


--
-- Name: idx_cong_viec_bao_tri_chinh_sach_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_chinh_sach_id ON public.cong_viec_bao_tri USING btree (chinh_sach_id);


--
-- Name: idx_cong_viec_bao_tri_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_he_thong_id ON public.cong_viec_bao_tri USING btree (he_thong_id);


--
-- Name: idx_cong_viec_bao_tri_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_su_co_id ON public.cong_viec_bao_tri USING btree (su_co_id);


--
-- Name: idx_cong_viec_bao_tri_van_de_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cong_viec_bao_tri_van_de_id ON public.cong_viec_bao_tri USING btree (van_de_id);


--
-- Name: idx_cp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cp_user ON public.conversation_participant USING btree (user_id);


--
-- Name: idx_cv_du_an; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_du_an ON public.du_an_cong_viec USING btree (du_an_id);


--
-- Name: idx_cv_moc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_moc ON public.du_an_cong_viec USING btree (moc_id);


--
-- Name: idx_cv_nguoi_xu_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cv_nguoi_xu_ly ON public.du_an_cong_viec USING btree (nguoi_xu_ly_chinh);


--
-- Name: idx_cvbt_den_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_den_han ON public.cong_viec_bao_tri USING btree (ngay_den_han);


--
-- Name: idx_cvbt_don_vi_snap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_don_vi_snap ON public.cong_viec_bao_tri USING btree (don_vi_id_snapshot);


--
-- Name: idx_cvbt_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_thiet_bi ON public.cong_viec_bao_tri USING btree (thiet_bi_id);


--
-- Name: idx_cvbt_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cvbt_trang_thai ON public.cong_viec_bao_tri USING btree (trang_thai);


--
-- Name: idx_dm_don_vi_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_don_vi_parent ON public.dm_don_vi USING btree (parent_id);


--
-- Name: idx_dm_he_thong_ma_tai_san_bravo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_ma_tai_san_bravo ON public.dm_he_thong USING btree (ma_tai_san_bravo);


--
-- Name: idx_dm_he_thong_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_nhom ON public.dm_he_thong USING btree (nhom_he_thong_id);


--
-- Name: idx_dm_he_thong_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_phan_loai ON public.dm_he_thong USING btree (phan_loai_id);


--
-- Name: idx_dm_he_thong_to_chuc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_he_thong_to_chuc_id ON public.dm_he_thong USING btree (to_chuc_id);


--
-- Name: idx_dm_model_field_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_field_set_id ON public.dm_model USING btree (field_set_id);


--
-- Name: idx_dm_model_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_loai ON public.dm_model USING btree (loai_thiet_bi_id);


--
-- Name: idx_dm_model_nsx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_model_nsx ON public.dm_model USING btree (nha_san_xuat_id);


--
-- Name: idx_dm_nhom_he_thong_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_nhom_he_thong_phan_loai ON public.dm_nhom_he_thong USING btree (phan_loai_id);


--
-- Name: idx_dm_to_chuc_to_chuc_cha_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_to_chuc_to_chuc_cha_id ON public.dm_to_chuc USING btree (to_chuc_cha_id);


--
-- Name: idx_dm_vi_tri_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dm_vi_tri_parent ON public.dm_vi_tri USING btree (parent_id);


--
-- Name: idx_dmht_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dmht_attrs_gin ON public.dm_he_thong USING gin (attrs jsonb_path_ops);


--
-- Name: idx_dnt_apdungcho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dnt_apdungcho ON public.dinh_nghia_truong USING btree (ap_dung_cho, thu_tu);


--
-- Name: idx_du_an_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_du_an_don_vi ON public.du_an USING btree (don_vi_id);


--
-- Name: idx_du_an_quan_ly; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_du_an_quan_ly ON public.du_an USING btree (quan_ly_id);


--
-- Name: idx_duan_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_duan_attrs_gin ON public.du_an USING gin (attrs jsonb_path_ops);


--
-- Name: idx_form_check_item_section; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_check_item_section ON public.form_check_item USING btree (section_id);


--
-- Name: idx_form_check_item_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_check_item_template ON public.form_check_item USING btree (template_id);


--
-- Name: idx_form_sign_otp_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_sign_otp_active ON public.form_sign_otp USING btree (submission_id, user_id) WHERE (consumed_at IS NULL);


--
-- Name: idx_form_sign_otp_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_sign_otp_user ON public.form_sign_otp USING btree (user_id, submission_id, created_at DESC);


--
-- Name: idx_form_submission_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submission_he_thong_id ON public.form_submission USING btree (he_thong_id);


--
-- Name: idx_form_submission_template_version_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_submission_template_version_id ON public.form_submission USING btree (template_version_id);


--
-- Name: idx_form_tpl_ht_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_tpl_ht_he_thong ON public.form_template_he_thong USING btree (he_thong_id);


--
-- Name: idx_form_tpl_ht_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_form_tpl_ht_template ON public.form_template_he_thong USING btree (template_id);


--
-- Name: idx_fsir_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fsir_submission ON public.form_submission_item_result USING btree (submission_id);


--
-- Name: idx_fss_signer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fss_signer ON public.form_submission_signature USING btree (signer_user_id);


--
-- Name: idx_fss_submission; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fss_submission ON public.form_submission_signature USING btree (submission_id);


--
-- Name: idx_ftinc_child; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftinc_child ON public.form_template_include USING btree (child_version_id);


--
-- Name: idx_ftinc_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftinc_parent ON public.form_template_include USING btree (parent_version_id, "position");


--
-- Name: idx_ftv_template; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ftv_template ON public.form_template_version USING btree (template_id);


--
-- Name: idx_gan_chuc_nang_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_chuc_nang_hong_hoc_id ON public.gan_chuc_nang USING btree (hong_hoc_id);


--
-- Name: idx_gan_chuc_nang_thiet_bi_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_chuc_nang_thiet_bi_open ON public.gan_chuc_nang USING btree (thiet_bi_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_gan_linh_kien_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gan_linh_kien_hong_hoc_id ON public.gan_linh_kien USING btree (hong_hoc_id);


--
-- Name: idx_gcn_thanh_phan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thanh_phan ON public.gan_chuc_nang USING btree (thanh_phan_id);


--
-- Name: idx_gcn_thanh_phan_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thanh_phan_active ON public.gan_chuc_nang USING btree (thanh_phan_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_gcn_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thiet_bi ON public.gan_chuc_nang USING btree (thiet_bi_id);


--
-- Name: idx_gcn_thiet_bi_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gcn_thiet_bi_active ON public.gan_chuc_nang USING btree (thiet_bi_id) WHERE (den_ngay IS NULL);


--
-- Name: idx_giay_phep_het_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_het_han ON public.giay_phep USING btree (ngay_het_han);


--
-- Name: idx_giay_phep_khai_thac_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_khai_thac_he_thong_id ON public.giay_phep_khai_thac USING btree (he_thong_id);


--
-- Name: idx_giay_phep_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_loai ON public.giay_phep USING btree (loai_giay_phep_id);


--
-- Name: idx_giay_phep_noi_cap; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_noi_cap ON public.giay_phep USING btree (noi_cap_id);


--
-- Name: idx_giay_phep_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_giay_phep_thiet_bi ON public.giay_phep USING btree (thiet_bi_id);


--
-- Name: idx_glk_khe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_glk_khe ON public.gan_linh_kien USING btree (khe_id);


--
-- Name: idx_glk_linh_kien; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_glk_linh_kien ON public.gan_linh_kien USING btree (linh_kien_id);


--
-- Name: idx_gpkt_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_gpkt_attrs_gin ON public.giay_phep_khai_thac USING gin (attrs jsonb_path_ops);


--
-- Name: idx_he_thong_thanh_phan_loai_thiet_bi_yeu_cau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_loai_thiet_bi_yeu_cau ON public.he_thong_thanh_phan USING btree (loai_thiet_bi_yeu_cau);


--
-- Name: idx_he_thong_thanh_phan_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_trang_thai_id ON public.he_thong_thanh_phan USING btree (trang_thai_id);


--
-- Name: idx_he_thong_thanh_phan_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_he_thong_thanh_phan_vi_tri_id ON public.he_thong_thanh_phan USING btree (vi_tri_id);


--
-- Name: idx_hong_hoc_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_ngay ON public.hong_hoc USING btree (ngay_hong DESC);


--
-- Name: idx_hong_hoc_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_trang_thai ON public.hong_hoc USING btree (trang_thai);


--
-- Name: idx_hong_hoc_trang_thai_moi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_hong_hoc_trang_thai_moi ON public.hong_hoc USING btree (trang_thai_moi);


--
-- Name: idx_ht_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ht_don_vi ON public.dm_he_thong USING btree (don_vi_id);


--
-- Name: idx_ht_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ht_nhom ON public.dm_he_thong USING btree (nhom_he_thong_id);


--
-- Name: idx_htp_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_htp_he_thong ON public.he_thong_thanh_phan USING btree (he_thong_id);


--
-- Name: idx_htp_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_htp_parent ON public.he_thong_thanh_phan USING btree (thanh_phan_cha);


--
-- Name: idx_http_cha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_http_cha ON public.he_thong_thanh_phan USING btree (thanh_phan_cha);


--
-- Name: idx_http_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_http_he_thong ON public.he_thong_thanh_phan USING btree (he_thong_id);


--
-- Name: idx_import_alias_canonical; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_alias_canonical ON public.import_alias USING btree (canonical_id);


--
-- Name: idx_import_alias_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_alias_lookup ON public.import_alias USING btree (entity, alias_norm);


--
-- Name: idx_import_batch_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_batch_hash ON public.import_batch USING btree (file_hash);


--
-- Name: idx_import_batch_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_batch_owner ON public.import_batch USING btree (created_by, created_at DESC);


--
-- Name: idx_import_item_apply; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_item_apply ON public.import_item USING btree (batch_id, status, applied_at);


--
-- Name: idx_import_item_batch; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_import_item_batch ON public.import_item USING btree (batch_id, sheet, row_index);


--
-- Name: idx_kgd_kho; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_kho ON public.kho_giao_dich USING btree (kho_id);


--
-- Name: idx_kgd_nhom; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_nhom ON public.kho_giao_dich USING btree (nhom_ct);


--
-- Name: idx_kgd_vat_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kgd_vat_tu ON public.kho_giao_dich USING btree (vat_tu_id);


--
-- Name: idx_khe_lk_cha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_khe_lk_cha ON public.thiet_bi_khe_linh_kien USING btree (khe_cha);


--
-- Name: idx_khe_lk_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_khe_lk_thiet_bi ON public.thiet_bi_khe_linh_kien USING btree (thiet_bi_id);


--
-- Name: idx_kho_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_don_vi_id ON public.kho USING btree (don_vi_id);


--
-- Name: idx_kho_giao_dich_lien_ket_cong_viec_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_cong_viec_id ON public.kho_giao_dich USING btree (lien_ket_cong_viec_id);


--
-- Name: idx_kho_giao_dich_lien_ket_hong_hoc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_hong_hoc_id ON public.kho_giao_dich USING btree (lien_ket_hong_hoc_id);


--
-- Name: idx_kho_giao_dich_lien_ket_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_giao_dich_lien_ket_su_co_id ON public.kho_giao_dich USING btree (lien_ket_su_co_id);


--
-- Name: idx_kho_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kho_vi_tri_id ON public.kho USING btree (vi_tri_id);


--
-- Name: idx_kiem_ke_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_kiem_ke_thiet_bi ON public.kiem_ke USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_lkht_dich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_dich ON public.lien_ket_he_thong USING btree (he_thong_dich_id);


--
-- Name: idx_lkht_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_don_vi ON public.lien_ket_he_thong USING btree (don_vi_id_snapshot);


--
-- Name: idx_lkht_nguon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkht_nguon ON public.lien_ket_he_thong USING btree (he_thong_nguon_id);


--
-- Name: idx_lkk_dich; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_dich ON public.lien_ket_khe USING btree (khe_dich_id);


--
-- Name: idx_lkk_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_loai ON public.lien_ket_khe USING btree (loai_lien_ket_id);


--
-- Name: idx_lkk_nguon; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lkk_nguon ON public.lien_ket_khe USING btree (khe_nguon_id);


--
-- Name: idx_messages_conv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_conv ON public.messages USING btree (conversation_id, created_at);


--
-- Name: idx_moc_du_an; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_moc_du_an ON public.du_an_moc USING btree (du_an_id);


--
-- Name: idx_model_tai_lieu_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_model_tai_lieu_model ON public.model_tai_lieu USING btree (model_id);


--
-- Name: idx_node_note_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_node_note_lookup ON public.node_note USING btree (node_type, node_id);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id, created_at DESC);


--
-- Name: idx_notifications_user_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_user_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (read_at IS NULL);


--
-- Name: idx_phoi_hop_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_phoi_hop_user ON public.du_an_cong_viec_phoi_hop USING btree (user_id);


--
-- Name: idx_pm_cong_viec_doi_tuong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_doi_tuong ON public.pm_cong_viec USING btree (doi_tuong_type, doi_tuong_id);


--
-- Name: idx_pm_cong_viec_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_don_vi ON public.pm_cong_viec USING btree (don_vi_id);


--
-- Name: idx_pm_cong_viec_han; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_han ON public.pm_cong_viec USING btree (han);


--
-- Name: idx_pm_cong_viec_han_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_han_trang_thai ON public.pm_cong_viec USING btree (han, trang_thai);


--
-- Name: idx_pm_cong_viec_nguoi_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_nguoi_phu_trach ON public.pm_cong_viec USING btree (nguoi_phu_trach_id, trang_thai);


--
-- Name: idx_pm_cong_viec_phu_trach; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_phu_trach ON public.pm_cong_viec USING btree (nguoi_phu_trach_id);


--
-- Name: idx_pm_cong_viec_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_cong_viec_trang_thai ON public.pm_cong_viec USING btree (trang_thai);


--
-- Name: idx_so_do_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_so_do_don_vi ON public.so_do_he_thong USING btree (don_vi_id);


--
-- Name: idx_su_co_at_bao_cao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_at_bao_cao ON public.su_co USING btree (at_bao_cao);


--
-- Name: idx_su_co_lich_su_obj_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_lich_su_obj_at ON public.su_co_lich_su USING btree (doi_tuong_bang, doi_tuong_id, at DESC);


--
-- Name: idx_su_co_ngay; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_ngay ON public.su_co USING btree (ngay_phat_hien DESC);


--
-- Name: idx_su_co_thiet_bi_dxl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_thiet_bi_dxl ON public.su_co USING btree (thiet_bi_id, at_bat_dau_xu_ly);


--
-- Name: idx_su_co_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai ON public.su_co USING btree (trang_thai);


--
-- Name: idx_su_co_trang_thai_moi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai_moi ON public.su_co USING btree (trang_thai_moi);


--
-- Name: idx_su_co_trang_thai_open; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_su_co_trang_thai_open ON public.su_co USING btree (trang_thai) WHERE (trang_thai = ANY (ARRAY['bao_cao'::text, 'tiep_nhan'::text, 'dang_xu_ly'::text, 'cho_vat_tu'::text]));


--
-- Name: idx_tb_don_vi_new; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tb_don_vi_new ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_tbkn_den; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tbkn_den ON public.thiet_bi_ket_noi USING btree (den_thiet_bi_id);


--
-- Name: idx_tbkn_tu; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tbkn_tu ON public.thiet_bi_ket_noi USING btree (tu_thiet_bi_id);


--
-- Name: idx_telegram_da_gui_sent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_telegram_da_gui_sent ON public.telegram_da_gui USING btree (sent_at DESC);


--
-- Name: idx_thiet_bi_attrs_gin; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_attrs_gin ON public.thiet_bi USING gin (attrs jsonb_path_ops);


--
-- Name: idx_thiet_bi_cap_phat_don_vi_giu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_cap_phat_don_vi_giu_id ON public.thiet_bi_cap_phat USING btree (don_vi_giu_id);


--
-- Name: idx_thiet_bi_cap_phat_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_cap_phat_tb ON public.thiet_bi_cap_phat USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_created ON public.thiet_bi USING btree (created_at DESC);


--
-- Name: idx_thiet_bi_danh_gia_nien_han_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_danh_gia_nien_han_id ON public.thiet_bi USING btree (danh_gia_nien_han_id);


--
-- Name: idx_thiet_bi_do_dac_chi_so; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_do_dac_chi_so ON public.thiet_bi_do_dac USING btree (chi_so);


--
-- Name: idx_thiet_bi_do_dac_tb_thoi_diem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_do_dac_tb_thoi_diem ON public.thiet_bi_do_dac USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_don_vi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_thiet_bi_don_vi_giu_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_giu_id ON public.thiet_bi USING btree (don_vi_giu_id);


--
-- Name: idx_thiet_bi_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_id ON public.thiet_bi USING btree (don_vi_id);


--
-- Name: idx_thiet_bi_don_vi_quan_ly_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_don_vi_quan_ly_id ON public.thiet_bi USING btree (don_vi_quan_ly_id);


--
-- Name: idx_thiet_bi_field_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_field_set_id ON public.thiet_bi USING btree (field_set_id);


--
-- Name: idx_thiet_bi_he_thong; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_he_thong ON public.thiet_bi USING btree (he_thong_id);


--
-- Name: idx_thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau ON public.thiet_bi_khe_linh_kien USING btree (loai_thiet_bi_yeu_cau);


--
-- Name: idx_thiet_bi_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_loai ON public.thiet_bi USING btree (loai_thiet_bi_id);


--
-- Name: idx_thiet_bi_ma; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma ON public.thiet_bi USING btree (ma_thiet_bi);


--
-- Name: idx_thiet_bi_ma_search; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma_search ON public.thiet_bi USING gin (to_tsvector('simple'::regconfig, ((((((COALESCE(ma_thiet_bi, ''::text) || ' '::text) || COALESCE(ten_thiet_bi, ''::text)) || ' '::text) || COALESCE(ma_serial, ''::text)) || ' '::text) || COALESCE(model, ''::text))));


--
-- Name: idx_thiet_bi_ma_tai_san_bravo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_ma_tai_san_bravo ON public.thiet_bi USING btree (ma_tai_san_bravo);


--
-- Name: idx_thiet_bi_model; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_model ON public.thiet_bi USING btree (model_id);


--
-- Name: idx_thiet_bi_nha_cung_cap_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nha_cung_cap_id ON public.thiet_bi USING btree (nha_cung_cap_id);


--
-- Name: idx_thiet_bi_nhom_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nhom_he_thong_id ON public.thiet_bi USING btree (nhom_he_thong_id);


--
-- Name: idx_thiet_bi_nsx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_nsx ON public.thiet_bi USING btree (nha_san_xuat_id);


--
-- Name: idx_thiet_bi_phan_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_phan_loai ON public.thiet_bi USING btree (phan_loai_id);


--
-- Name: idx_thiet_bi_search_tsv; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_search_tsv ON public.thiet_bi USING gin (search_tsv);


--
-- Name: idx_thiet_bi_tep_thiet_bi; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_tep_thiet_bi ON public.thiet_bi_tep_dinh_kem USING btree (thiet_bi_id);


--
-- Name: idx_thiet_bi_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_trang_thai ON public.thiet_bi USING btree (trang_thai_id);


--
-- Name: idx_thiet_bi_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_trang_thai_id ON public.thiet_bi USING btree (trang_thai_id);


--
-- Name: idx_thiet_bi_vi_tri_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vi_tri_id ON public.thiet_bi USING btree (vi_tri_id);


--
-- Name: idx_thiet_bi_vong_doi_den_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_den_trang_thai_id ON public.thiet_bi_vong_doi USING btree (den_trang_thai_id);


--
-- Name: idx_thiet_bi_vong_doi_tb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_tb ON public.thiet_bi_vong_doi USING btree (thiet_bi_id, thoi_diem DESC);


--
-- Name: idx_thiet_bi_vong_doi_tu_trang_thai_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_thiet_bi_vong_doi_tu_trang_thai_id ON public.thiet_bi_vong_doi USING btree (tu_trang_thai_id);


--
-- Name: idx_ticket_comment_ticket; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ticket_comment_ticket ON public.ticket_comment USING btree (ticket_id, created_at);


--
-- Name: idx_tickets_assigned_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_assigned_to ON public.tickets USING btree (assigned_to);


--
-- Name: idx_tickets_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_created_by ON public.tickets USING btree (created_by);


--
-- Name: idx_tickets_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_he_thong_id ON public.tickets USING btree (he_thong_id);


--
-- Name: idx_tickets_su_co_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_su_co_id ON public.tickets USING btree (su_co_id);


--
-- Name: idx_tickets_thiet_bi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_thiet_bi_id ON public.tickets USING btree (thiet_bi_id);


--
-- Name: idx_tickets_trang_thai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tickets_trang_thai ON public.tickets USING btree (trang_thai);


--
-- Name: idx_user_pinned_user_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_pinned_user_order ON public.user_pinned USING btree (user_id, "order");


--
-- Name: idx_user_recent_user_viewed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_recent_user_viewed ON public.user_recent USING btree (user_id, viewed_at DESC);


--
-- Name: idx_user_scope_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_scope_don_vi_id ON public.user_scope USING btree (don_vi_id);


--
-- Name: idx_user_scope_to_chuc_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_scope_to_chuc_id ON public.user_scope USING btree (to_chuc_id);


--
-- Name: idx_van_de_he_thong_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_van_de_he_thong_id ON public.van_de USING btree (he_thong_id);


--
-- Name: idx_van_de_thiet_bi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_van_de_thiet_bi_id ON public.van_de USING btree (thiet_bi_id);


--
-- Name: idx_vat_tu_don_vi_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_don_vi_id ON public.vat_tu USING btree (don_vi_id);


--
-- Name: idx_vat_tu_model_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_model_id ON public.vat_tu USING btree (model_id);


--
-- Name: idx_vat_tu_nha_cung_cap_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vat_tu_nha_cung_cap_id ON public.vat_tu USING btree (nha_cung_cap_id);


--
-- Name: idx_webauthn_credentials_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webauthn_credentials_user ON public.webauthn_credentials USING btree (user_id);


--
-- Name: ix_lkht_dich_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_dich_active ON public.lien_ket_he_thong USING btree (he_thong_dich_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: ix_lkht_hieuluc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_hieuluc ON public.lien_ket_he_thong USING btree (hieu_luc_tu, hieu_luc_den);


--
-- Name: ix_lkht_loai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_loai ON public.lien_ket_he_thong USING btree (loai_lien_ket_id);


--
-- Name: ix_lkht_nguon_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkht_nguon_active ON public.lien_ket_he_thong USING btree (he_thong_nguon_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: ix_lkk_hieuluc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_lkk_hieuluc ON public.lien_ket_khe USING btree (hieu_luc_tu, hieu_luc_den);


--
-- Name: ix_mdt_dac_tinh; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_mdt_dac_tinh ON public.dm_model_dac_tinh USING btree (dac_tinh_id);


--
-- Name: mv_asset_anomaly_asset_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mv_asset_anomaly_asset_id_idx ON public.mv_asset_anomaly USING btree (asset_id);


--
-- Name: mv_asset_anomaly_z_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX mv_asset_anomaly_z_idx ON public.mv_asset_anomaly USING btree (z_score);


--
-- Name: mv_dashboard_overview_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX mv_dashboard_overview_uniq ON public.mv_dashboard_overview USING btree (((payload ->> 'refreshed_at'::text)));


--
-- Name: search_index_loai_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_loai_idx ON public.search_index USING btree (loai);


--
-- Name: search_index_ma_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_ma_trgm ON public.search_index USING gin (public.f_unaccent(COALESCE(ma, ''::text)) public.gin_trgm_ops);


--
-- Name: search_index_tieude_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_tieude_trgm ON public.search_index USING gin (public.f_unaccent(tieu_de) public.gin_trgm_ops);


--
-- Name: search_index_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX search_index_tsv_idx ON public.search_index USING gin (tsv);


--
-- Name: so_do_tep_so_do_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX so_do_tep_so_do_id_idx ON public.so_do_tep_dinh_kem USING btree (so_do_id);


--
-- Name: su_co_thanh_phan_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_thanh_phan_id_idx ON public.su_co USING btree (thanh_phan_id);


--
-- Name: su_co_thiet_bi_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_thiet_bi_id_idx ON public.su_co USING btree (thiet_bi_id);


--
-- Name: su_co_van_de_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX su_co_van_de_id_idx ON public.su_co USING btree (van_de_id);


--
-- Name: thiet_bi_search_trgm_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thiet_bi_search_trgm_idx ON public.thiet_bi USING gin (search_text public.gin_trgm_ops);


--
-- Name: thiet_bi_search_tsv_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thiet_bi_search_tsv_idx ON public.thiet_bi USING gin (search_tsv);


--
-- Name: thong_bao_cau_hinh_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX thong_bao_cau_hinh_uniq ON public.thong_bao_cau_hinh USING btree (scope, COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(loai, ''::text));


--
-- Name: thong_bao_den_han_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_den_han_idx ON public.thong_bao USING btree (den_han_at);


--
-- Name: thong_bao_don_vi_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_don_vi_idx ON public.thong_bao USING btree (don_vi_id, da_doc);


--
-- Name: thong_bao_email_queue_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_email_queue_status_idx ON public.thong_bao_email_queue USING btree (trang_thai, created_at);


--
-- Name: thong_bao_nguoi_nhan_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX thong_bao_nguoi_nhan_idx ON public.thong_bao USING btree (nguoi_nhan, da_doc, created_at DESC);


--
-- Name: uq_canh_bao_het_han_log_khoa; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_canh_bao_het_han_log_khoa ON public.canh_bao_het_han_log USING btree (khoa);


--
-- Name: uq_gcn_thanh_phan_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_gcn_thanh_phan_active ON public.gan_chuc_nang USING btree (thanh_phan_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_glk_khe_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_glk_khe_active ON public.gan_linh_kien USING btree (khe_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_glk_linh_kien_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_glk_linh_kien_active ON public.gan_linh_kien USING btree (linh_kien_id) WHERE (den_ngay IS NULL);


--
-- Name: uq_import_alias; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_import_alias ON public.import_alias USING btree (entity, COALESCE(scope, ''::text), alias_norm);


--
-- Name: uq_thiet_bi_ket_noi; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uq_thiet_bi_ket_noi ON public.thiet_bi_ket_noi USING btree (tu_thiet_bi_id, den_thiet_bi_id, COALESCE(tu_cong, ''::text), COALESCE(den_cong, ''::text), loai);


--
-- Name: user_scope_uniq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_scope_uniq ON public.user_scope USING btree (user_id, COALESCE(to_chuc_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(don_vi_id, '00000000-0000-0000-0000-000000000000'::uuid));


--
-- Name: user_scope_user_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_scope_user_idx ON public.user_scope USING btree (user_id);


--
-- Name: ux_lkht_canh_hieu_luc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lkht_canh_hieu_luc ON public.lien_ket_he_thong USING btree (he_thong_nguon_id, he_thong_dich_id, loai_lien_ket_id, lop) WHERE (hieu_luc_den IS NULL);


--
-- Name: ux_lkk_canh_hieu_luc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ux_lkk_canh_hieu_luc ON public.lien_ket_khe USING btree (khe_nguon_id, khe_dich_id, loai_lien_ket_id) WHERE (hieu_luc_den IS NULL);


--
-- Name: vi_tri_media_vi_tri_ma_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vi_tri_media_vi_tri_ma_idx ON public.vi_tri_media USING btree (vi_tri_ma);


--
-- Name: ai_config ai_config_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_config_set_updated_at BEFORE UPDATE ON public.ai_config FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: ai_conversation ai_conversation_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER ai_conversation_set_updated_at BEFORE UPDATE ON public.ai_conversation FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_don_vi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_don_vi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_he_thong audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_giay_phep audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_giay_phep FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nha_cung_cap audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nha_cung_cap FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nha_san_xuat audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nha_san_xuat FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_nhom_he_thong audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_noi_cap audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_noi_cap FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_trang_thai_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_trang_thai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_vi_tri audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.dm_vi_tri FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_field audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_field FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_submission audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_submission FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_submission_thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_submission_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: form_template audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.form_template FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: giay_phep audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.giay_phep FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: profiles audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: thiet_bi audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: thiet_bi_tep_dinh_kem audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: user_roles audit_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg AFTER INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: dm_loai_lien_ket audit_trg_dm_loai_lien_ket; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_dm_loai_lien_ket AFTER INSERT OR DELETE OR UPDATE ON public.dm_loai_lien_ket FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: lien_ket_he_thong audit_trg_lien_ket_he_thong; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_lien_ket_he_thong AFTER INSERT OR DELETE OR UPDATE ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: lien_ket_khe audit_trg_lien_ket_khe; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER audit_trg_lien_ket_khe AFTER INSERT OR DELETE OR UPDATE ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: bao_tri bao_tri_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER bao_tri_3lop BEFORE INSERT OR UPDATE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.trg_bao_tri_3lop();


--
-- Name: cong_viec_bao_tri cvbt_ma_before_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cvbt_ma_before_ins BEFORE INSERT ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.trg_cvbt_ma();


--
-- Name: cong_viec_bao_tri cvbt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER cvbt_updated_at BEFORE UPDATE ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: gan_chuc_nang gcn_sync_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER gcn_sync_thiet_bi BEFORE INSERT OR UPDATE ON public.gan_chuc_nang FOR EACH ROW EXECUTE FUNCTION public.trg_sync_thiet_bi_from_thanh_phan();


--
-- Name: gan_linh_kien glk_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER glk_before BEFORE INSERT OR UPDATE ON public.gan_linh_kien FOR EACH ROW EXECUTE FUNCTION public.trg_glk_before();


--
-- Name: dm_he_thong he_thong_cascade_don_vi_tai_san; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER he_thong_cascade_don_vi_tai_san AFTER UPDATE OF don_vi_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_he_thong_don_vi_to_tai_san();


--
-- Name: hong_hoc hong_hoc_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER hong_hoc_3lop BEFORE INSERT OR UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.trg_hong_hoc_3lop();


--
-- Name: he_thong_thanh_phan http_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_before BEFORE UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_before();


--
-- Name: he_thong_thanh_phan http_sync_device; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_sync_device AFTER UPDATE OF vi_tri_id, trang_thai_id, don_vi_id_snapshot, he_thong_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_sync_device();


--
-- Name: he_thong_thanh_phan http_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER http_touch BEFORE UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_http_touch();


--
-- Name: import_alias import_alias_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER import_alias_set_updated_at BEFORE UPDATE ON public.import_alias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: import_batch import_batch_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER import_batch_set_updated_at BEFORE UPDATE ON public.import_batch FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: kho_giao_dich kgd_before_ins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kgd_before_ins BEFORE INSERT ON public.kho_giao_dich FOR EACH ROW EXECUTE FUNCTION public.trg_kgd_before_ins();


--
-- Name: thiet_bi_khe_linh_kien khe_lk_guard; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER khe_lk_guard BEFORE UPDATE ON public.thiet_bi_khe_linh_kien FOR EACH ROW EXECUTE FUNCTION public.trg_khe_lk_before_update();


--
-- Name: kho kho_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER kho_updated_at BEFORE UPDATE ON public.kho FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: su_co su_co_3lop; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER su_co_3lop BEFORE INSERT OR UPDATE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.trg_su_co_3lop();


--
-- Name: thiet_bi_ket_noi tbkn_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tbkn_audit AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi_ket_noi FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_audit();


--
-- Name: thiet_bi_ket_noi tbkn_before; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tbkn_before BEFORE INSERT OR UPDATE ON public.thiet_bi_ket_noi FOR EACH ROW EXECUTE FUNCTION public.trg_tbkn_before();


--
-- Name: he_thong_thanh_phan thanh_phan_cascade_vi_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thanh_phan_cascade_vi_tri AFTER UPDATE OF vi_tri_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.trg_cascade_thanh_phan_vi_tri();


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thong_bao_cau_hinh_updated_at BEFORE UPDATE ON public.thong_bao_cau_hinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thong_bao thong_bao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER thong_bao_updated_at BEFORE UPDATE ON public.thong_bao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audit_log trg_audit_bulk_delete; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_bulk_delete AFTER INSERT ON public.audit_log FOR EACH ROW EXECUTE FUNCTION public.trg_detect_bulk_delete();


--
-- Name: he_thong_thanh_phan trg_audit_he_thong_thanh_phan; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_audit_he_thong_thanh_phan AFTER INSERT OR DELETE OR UPDATE ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: backup_lich_su trg_backup_lich_su_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_backup_lich_su_updated BEFORE UPDATE ON public.backup_lich_su FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bang_cot_tuy_chinh trg_bang_cot_tuy_chinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bang_cot_tuy_chinh_updated_at BEFORE UPDATE ON public.bang_cot_tuy_chinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bao_cao_annotation trg_bao_cao_annotation_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bao_cao_annotation_updated BEFORE UPDATE ON public.bao_cao_annotation FOR EACH ROW EXECUTE FUNCTION public.tg_bao_cao_annotation_updated();


--
-- Name: bao_tri_chinh_sach trg_bao_tri_chinh_sach_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_bao_tri_chinh_sach_updated BEFORE UPDATE ON public.bao_tri_chinh_sach FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_cascade_he_thong_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cascade_he_thong_don_vi AFTER UPDATE OF don_vi_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.cascade_he_thong_don_vi();


--
-- Name: cay_node_edit trg_cay_node_edit_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cay_node_edit_updated_at BEFORE UPDATE ON public.cay_node_edit FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: change_request trg_change_request_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_change_request_touch BEFORE UPDATE ON public.change_request FOR EACH ROW EXECUTE FUNCTION public.tg_change_request_touch();


--
-- Name: cay_thay_doi trg_ctd_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ctd_updated BEFORE UPDATE ON public.cay_thay_doi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: du_an_cong_viec trg_cv_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_audit AFTER INSERT OR DELETE OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_cong_viec trg_cv_notify; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_notify AFTER INSERT OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.notify_cong_viec_change();


--
-- Name: du_an_cong_viec trg_cv_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cv_updated BEFORE UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_dac_tinh trg_dm_dac_tinh_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_dac_tinh_updated_at BEFORE UPDATE ON public.dm_dac_tinh FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_don_vi trg_dm_don_vi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_don_vi_updated_at BEFORE UPDATE ON public.dm_don_vi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_dm_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_he_thong_updated_at BEFORE UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_giay_phep trg_dm_loai_giay_phep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_giay_phep_updated_at BEFORE UPDATE ON public.dm_loai_giay_phep FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_lien_ket trg_dm_loai_lien_ket_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_lien_ket_updated_at BEFORE UPDATE ON public.dm_loai_lien_ket FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_loai_thiet_bi trg_dm_loai_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_loai_thiet_bi_updated_at BEFORE UPDATE ON public.dm_loai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_model trg_dm_model_propagate; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_model_propagate AFTER UPDATE ON public.dm_model FOR EACH ROW EXECUTE FUNCTION public.dm_model_propagate_to_thiet_bi();


--
-- Name: dm_nha_cung_cap trg_dm_nha_cung_cap_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nha_cung_cap_updated_at BEFORE UPDATE ON public.dm_nha_cung_cap FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_nha_san_xuat trg_dm_nha_san_xuat_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nha_san_xuat_updated_at BEFORE UPDATE ON public.dm_nha_san_xuat FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_nhom_he_thong trg_dm_nhom_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nhom_he_thong_updated_at BEFORE UPDATE ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_danh_gia_nien_han trg_dm_nien_han_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_nien_han_updated_at BEFORE UPDATE ON public.dm_danh_gia_nien_han FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_noi_cap trg_dm_noi_cap_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_noi_cap_updated_at BEFORE UPDATE ON public.dm_noi_cap FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_to_chuc trg_dm_to_chuc_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_to_chuc_updated_at BEFORE UPDATE ON public.dm_to_chuc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_trang_thai_thiet_bi trg_dm_trang_thai_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_trang_thai_thiet_bi_updated_at BEFORE UPDATE ON public.dm_trang_thai_thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_vi_tri trg_dm_vi_tri_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dm_vi_tri_updated_at BEFORE UPDATE ON public.dm_vi_tri FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dinh_nghia_truong trg_dnt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_dnt_updated_at BEFORE UPDATE ON public.dinh_nghia_truong FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: du_an trg_du_an_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_du_an_audit AFTER INSERT OR DELETE OR UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an trg_du_an_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_du_an_updated BEFORE UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: field_set_item trg_field_set_item_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_field_set_item_updated_at BEFORE UPDATE ON public.field_set_item FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: field_set trg_field_set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_field_set_updated_at BEFORE UPDATE ON public.field_set FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_check_item trg_form_check_item_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_check_item_updated BEFORE UPDATE ON public.form_check_item FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_field trg_form_field_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_field_updated_at BEFORE UPDATE ON public.form_field FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_section trg_form_section_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_section_updated BEFORE UPDATE ON public.form_section FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_submission trg_form_submission_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_submission_updated_at BEFORE UPDATE ON public.form_submission FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_template trg_form_template_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_form_template_updated_at BEFORE UPDATE ON public.form_template FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: form_submission_item_result trg_fsir_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fsir_updated BEFORE UPDATE ON public.form_submission_item_result FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: form_template_include trg_ftinc_parent_draft; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftinc_parent_draft BEFORE INSERT OR DELETE OR UPDATE ON public.form_template_include FOR EACH ROW EXECUTE FUNCTION public.ftinc_parent_must_be_draft();


--
-- Name: form_template_version trg_ftv_lock_published; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftv_lock_published BEFORE UPDATE ON public.form_template_version FOR EACH ROW EXECUTE FUNCTION public.ftv_lock_published();


--
-- Name: form_template_version trg_ftv_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ftv_updated_at BEFORE UPDATE ON public.form_template_version FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: giay_phep trg_giay_phep_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_giay_phep_updated_at BEFORE UPDATE ON public.giay_phep FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: giay_phep_khai_thac trg_gpkt_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_gpkt_updated_at BEFORE UPDATE ON public.giay_phep_khai_thac FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_he_thong trg_he_thong_cascade_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_he_thong_cascade_thiet_bi AFTER UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.he_thong_cascade_thiet_bi();


--
-- Name: dm_he_thong trg_he_thong_sync_phan_loai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_he_thong_sync_phan_loai BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.he_thong_sync_phan_loai();


--
-- Name: he_thong_truong trg_htt_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_htt_updated BEFORE UPDATE ON public.he_thong_truong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi_khe_linh_kien trg_khe_lk_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_khe_lk_updated_at BEFORE UPDATE ON public.thiet_bi_khe_linh_kien FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_he_thong trg_lien_ket_he_thong_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lien_ket_he_thong_updated_at BEFORE UPDATE ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_khe trg_lien_ket_khe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lien_ket_khe_updated_at BEFORE UPDATE ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lien_ket_he_thong trg_lkht_snapshot_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lkht_snapshot_don_vi BEFORE INSERT ON public.lien_ket_he_thong FOR EACH ROW EXECUTE FUNCTION public.lkht_snapshot_don_vi();


--
-- Name: lien_ket_khe trg_lkk_snapshot_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_lkk_snapshot_don_vi BEFORE INSERT ON public.lien_ket_khe FOR EACH ROW EXECUTE FUNCTION public.lkk_snapshot_don_vi();


--
-- Name: du_an_moc trg_moc_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_moc_updated BEFORE UPDATE ON public.du_an_moc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: model_tai_lieu trg_model_tai_lieu_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_model_tai_lieu_updated BEFORE UPDATE ON public.model_tai_lieu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nhan_vien trg_nhan_vien_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhan_vien_updated_at BEFORE UPDATE ON public.nhan_vien FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_nhom_he_thong trg_nhom_cascade_phan_loai; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_nhom_cascade_phan_loai AFTER UPDATE OF phan_loai_id ON public.dm_nhom_he_thong FOR EACH ROW EXECUTE FUNCTION public.nhom_cascade_phan_loai();


--
-- Name: node_note trg_node_note_touch; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_node_note_touch BEFORE UPDATE ON public.node_note FOR EACH ROW EXECUTE FUNCTION public.tg_node_note_touch();


--
-- Name: messages trg_notify_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message();


--
-- Name: ticket_comment trg_notify_ticket_comment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_comment AFTER INSERT ON public.ticket_comment FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_comment();


--
-- Name: tickets trg_notify_ticket_new; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_new AFTER INSERT ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_new();


--
-- Name: tickets trg_notify_ticket_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_notify_ticket_update AFTER UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.notify_ticket_update();


--
-- Name: pm_cong_viec trg_pm_cong_viec_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_pm_cong_viec_updated_at BEFORE UPDATE ON public.pm_cong_viec FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles trg_protect_profile_privileged_fields; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_protect_profile_privileged_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_fields();


--
-- Name: ban_giao trg_search_index_ban_giao; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_ban_giao AFTER INSERT OR DELETE OR UPDATE ON public.ban_giao FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('ban_giao');


--
-- Name: bao_tri trg_search_index_bao_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_bao_tri AFTER INSERT OR DELETE OR UPDATE ON public.bao_tri FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('bao_tri');


--
-- Name: cong_viec_bao_tri trg_search_index_cong_viec_bao_tri; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_cong_viec_bao_tri AFTER INSERT OR DELETE OR UPDATE ON public.cong_viec_bao_tri FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('cong_viec_bao_tri');


--
-- Name: dm_he_thong trg_search_index_dm_he_thong; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_dm_he_thong AFTER INSERT OR DELETE OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('dm_he_thong');


--
-- Name: giay_phep_khai_thac trg_search_index_giay_phep_khai_thac; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_giay_phep_khai_thac AFTER INSERT OR DELETE OR UPDATE ON public.giay_phep_khai_thac FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('giay_phep_khai_thac');


--
-- Name: hong_hoc trg_search_index_hong_hoc; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_hong_hoc AFTER INSERT OR DELETE OR UPDATE ON public.hong_hoc FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('hong_hoc');


--
-- Name: su_co trg_search_index_su_co; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_su_co AFTER INSERT OR DELETE OR UPDATE ON public.su_co FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('su_co');


--
-- Name: thiet_bi trg_search_index_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_thiet_bi AFTER INSERT OR DELETE OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('thiet_bi');


--
-- Name: van_de trg_search_index_van_de; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_van_de AFTER INSERT OR DELETE OR UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('van_de');


--
-- Name: vat_tu trg_search_index_vat_tu; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_search_index_vat_tu AFTER INSERT OR DELETE OR UPDATE ON public.vat_tu FOR EACH ROW EXECUTE FUNCTION public.sync_search_index('vat_tu');


--
-- Name: so_do_he_thong trg_so_do_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_so_do_updated_at BEFORE UPDATE ON public.so_do_he_thong FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_sync_taxonomy_thiet_bi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_taxonomy_thiet_bi BEFORE INSERT OR UPDATE OF he_thong_id, nhom_he_thong_id, phan_loai_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.sync_taxonomy_thiet_bi();


--
-- Name: he_thong_thanh_phan trg_sync_thanh_phan_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_sync_thanh_phan_don_vi BEFORE INSERT OR UPDATE OF he_thong_id ON public.he_thong_thanh_phan FOR EACH ROW EXECUTE FUNCTION public.sync_thanh_phan_don_vi();


--
-- Name: thiet_bi trg_tb_serial_khong_trung; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tb_serial_khong_trung BEFORE INSERT OR UPDATE OF ma_serial ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.tb_serial_khong_trung();


--
-- Name: telegram_subscriber trg_tele_sub_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tele_sub_updated BEFORE UPDATE ON public.telegram_subscriber FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: thiet_bi_tep_dinh_kem trg_tep_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tep_updated BEFORE UPDATE ON public.thiet_bi_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_thiet_bi_inherit_model; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_inherit_model BEFORE INSERT OR UPDATE OF model_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_inherit_model();


--
-- Name: thiet_bi trg_thiet_bi_sync_hierarchy; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_sync_hierarchy BEFORE INSERT OR UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_sync_hierarchy();


--
-- Name: thiet_bi trg_thiet_bi_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_updated_at BEFORE UPDATE ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: thiet_bi trg_thiet_bi_vong_doi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_thiet_bi_vong_doi AFTER UPDATE OF trang_thai_id ON public.thiet_bi FOR EACH ROW EXECUTE FUNCTION public.log_thiet_bi_vong_doi();


--
-- Name: tickets trg_tickets_sla; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tickets_sla BEFORE INSERT OR UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.trg_ticket_sla();


--
-- Name: tickets trg_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_layout_prefs trg_touch_user_layout_prefs; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_touch_user_layout_prefs BEFORE UPDATE ON public.user_layout_prefs FOR EACH ROW EXECUTE FUNCTION public.touch_user_layout_prefs();


--
-- Name: dm_he_thong trg_validate_dm_he_thong_taxonomy; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_dm_he_thong_taxonomy BEFORE INSERT OR UPDATE OF nhom_he_thong_id, phan_loai_id ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.validate_dm_he_thong_taxonomy();


--
-- Name: dm_he_thong trg_validate_he_thong_don_vi; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_he_thong_don_vi BEFORE INSERT OR UPDATE ON public.dm_he_thong FOR EACH ROW EXECUTE FUNCTION public.validate_he_thong_don_vi();


--
-- Name: gan_chuc_nang trg_validate_thiet_bi_he_thong_khi_lap; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_validate_thiet_bi_he_thong_khi_lap BEFORE INSERT OR UPDATE ON public.gan_chuc_nang FOR EACH ROW EXECUTE FUNCTION public.validate_thiet_bi_he_thong_khi_lap();


--
-- Name: van_de trg_van_de_audit; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_audit AFTER INSERT OR DELETE OR UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: van_de trg_van_de_ma; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_ma BEFORE INSERT ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.gen_ma_van_de();


--
-- Name: van_de trg_van_de_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_van_de_updated BEFORE UPDATE ON public.van_de FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: dm_model update_dm_model_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dm_model_updated_at BEFORE UPDATE ON public.dm_model FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: dm_phan_loai update_dm_phan_loai_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_dm_phan_loai_updated_at BEFORE UPDATE ON public.dm_phan_loai FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vat_tu vat_tu_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER vat_tu_updated_at BEFORE UPDATE ON public.vat_tu FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cay_node_edit zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.cay_node_edit FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_cong_viec zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an_cong_viec FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: du_an_moc zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.du_an_moc FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: so_do_he_thong zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.so_do_he_thong FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: so_do_tep_dinh_kem zz_audit_row; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER zz_audit_row AFTER INSERT OR DELETE OR UPDATE ON public.so_do_tep_dinh_kem FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();


--
-- Name: ai_message ai_message_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_message
    ADD CONSTRAINT ai_message_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversation(id) ON DELETE CASCADE;


--
-- Name: bao_cao_annotation bao_cao_annotation_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: bao_cao_annotation bao_cao_annotation_tao_boi_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_cao_annotation
    ADD CONSTRAINT bao_cao_annotation_tao_boi_fkey FOREIGN KEY (tao_boi) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE CASCADE;


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_nguoi_phu_trach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bao_tri_chinh_sach
    ADD CONSTRAINT bao_tri_chinh_sach_nguoi_phu_trach_id_fkey FOREIGN KEY (nguoi_phu_trach_id) REFERENCES public.nhan_vien(id) ON DELETE SET NULL;


--
-- Name: change_request change_request_nguoi_tao_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_nguoi_tao_fkey FOREIGN KEY (nguoi_tao) REFERENCES auth.users(id);


--
-- Name: change_request change_request_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.change_request
    ADD CONSTRAINT change_request_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id);


--
-- Name: chung_chi_thiet_bi chung_chi_thiet_bi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chung_chi_thiet_bi
    ADD CONSTRAINT chung_chi_thiet_bi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_bao_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_bao_tri_id_fkey FOREIGN KEY (bao_tri_id) REFERENCES public.bao_tri(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_chinh_sach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_chinh_sach_id_fkey FOREIGN KEY (chinh_sach_id) REFERENCES public.bao_tri_chinh_sach(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_su_co_id_fkey FOREIGN KEY (su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: cong_viec_bao_tri cong_viec_bao_tri_van_de_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cong_viec_bao_tri
    ADD CONSTRAINT cong_viec_bao_tri_van_de_id_fkey FOREIGN KEY (van_de_id) REFERENCES public.van_de(id) ON DELETE SET NULL;


--
-- Name: conversation_participant conversation_participant_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversation_participant
    ADD CONSTRAINT conversation_participant_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: dm_dac_tinh dm_dac_tinh_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_dac_tinh
    ADD CONSTRAINT dm_dac_tinh_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_dac_tinh(id) ON DELETE SET NULL;


--
-- Name: dm_danh_gia_nien_han dm_danh_gia_nien_han_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_danh_gia_nien_han
    ADD CONSTRAINT dm_danh_gia_nien_han_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL;


--
-- Name: dm_don_vi dm_don_vi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_don_vi dm_don_vi_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_don_vi
    ADD CONSTRAINT dm_don_vi_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_nhom_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_nhom_he_thong_id_fkey FOREIGN KEY (nhom_he_thong_id) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_he_thong dm_he_thong_to_chuc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_he_thong
    ADD CONSTRAINT dm_he_thong_to_chuc_id_fkey FOREIGN KEY (to_chuc_id) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_loai_giay_phep dm_loai_giay_phep_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_giay_phep
    ADD CONSTRAINT dm_loai_giay_phep_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_giay_phep(id) ON DELETE SET NULL;


--
-- Name: dm_loai_lien_ket dm_loai_lien_ket_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_lien_ket
    ADD CONSTRAINT dm_loai_lien_ket_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_lien_ket(id) ON DELETE SET NULL;


--
-- Name: dm_loai_thiet_bi dm_loai_thiet_bi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_loai_thiet_bi
    ADD CONSTRAINT dm_loai_thiet_bi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_dac_tinh_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_dac_tinh_id_fkey FOREIGN KEY (dac_tinh_id) REFERENCES public.dm_dac_tinh(id) ON DELETE RESTRICT;


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model_dac_tinh
    ADD CONSTRAINT dm_model_dac_tinh_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE CASCADE;


--
-- Name: dm_model dm_model_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_model(id) ON DELETE SET NULL;


--
-- Name: dm_model dm_model_nha_san_xuat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_model
    ADD CONSTRAINT dm_model_nha_san_xuat_id_fkey FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL;


--
-- Name: dm_nha_cung_cap dm_nha_cung_cap_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_cung_cap
    ADD CONSTRAINT dm_nha_cung_cap_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL;


--
-- Name: dm_nha_san_xuat dm_nha_san_xuat_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nha_san_xuat
    ADD CONSTRAINT dm_nha_san_xuat_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nha_san_xuat(id) ON DELETE SET NULL;


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: dm_nhom_he_thong dm_nhom_he_thong_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_nhom_he_thong
    ADD CONSTRAINT dm_nhom_he_thong_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_noi_cap dm_noi_cap_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_noi_cap
    ADD CONSTRAINT dm_noi_cap_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_noi_cap(id) ON DELETE SET NULL;


--
-- Name: dm_phan_loai dm_phan_loai_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_phan_loai
    ADD CONSTRAINT dm_phan_loai_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: dm_to_chuc dm_to_chuc_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_to_chuc dm_to_chuc_to_chuc_cha_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_to_chuc
    ADD CONSTRAINT dm_to_chuc_to_chuc_cha_id_fkey FOREIGN KEY (to_chuc_cha_id) REFERENCES public.dm_to_chuc(id) ON DELETE SET NULL;


--
-- Name: dm_trang_thai_thiet_bi dm_trang_thai_thiet_bi_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_trang_thai_thiet_bi
    ADD CONSTRAINT dm_trang_thai_thiet_bi_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: dm_vi_tri dm_vi_tri_merged_into_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_merged_into_fkey FOREIGN KEY (merged_into) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: dm_vi_tri dm_vi_tri_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dm_vi_tri
    ADD CONSTRAINT dm_vi_tri_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: du_an_cong_viec du_an_cong_viec_du_an_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_du_an_id_fkey FOREIGN KEY (du_an_id) REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_viec du_an_cong_viec_moc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec
    ADD CONSTRAINT du_an_cong_viec_moc_id_fkey FOREIGN KEY (moc_id) REFERENCES public.du_an_moc(id) ON DELETE CASCADE;


--
-- Name: du_an_cong_viec_phoi_hop du_an_cong_viec_phoi_hop_cong_viec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_cong_viec_phoi_hop
    ADD CONSTRAINT du_an_cong_viec_phoi_hop_cong_viec_id_fkey FOREIGN KEY (cong_viec_id) REFERENCES public.du_an_cong_viec(id) ON DELETE CASCADE;


--
-- Name: du_an du_an_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an
    ADD CONSTRAINT du_an_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: du_an_moc du_an_moc_du_an_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.du_an_moc
    ADD CONSTRAINT du_an_moc_du_an_id_fkey FOREIGN KEY (du_an_id) REFERENCES public.du_an(id) ON DELETE CASCADE;


--
-- Name: field_set_item field_set_item_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.field_set_item
    ADD CONSTRAINT field_set_item_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE CASCADE;


--
-- Name: form_check_item form_check_item_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.form_section(id) ON DELETE CASCADE;


