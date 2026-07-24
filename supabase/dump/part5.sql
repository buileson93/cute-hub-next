SET search_path = public, pg_catalog;
--
-- Name: form_check_item form_check_item_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_check_item
    ADD CONSTRAINT form_check_item_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_field form_field_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_field
    ADD CONSTRAINT form_field_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_section form_section_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_section
    ADD CONSTRAINT form_section_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_sign_otp form_sign_otp_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_sign_otp form_sign_otp_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_sign_otp
    ADD CONSTRAINT form_sign_otp_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: form_submission form_submission_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: form_submission form_submission_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id);


--
-- Name: form_submission_item_result form_submission_item_result_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_item_result
    ADD CONSTRAINT form_submission_item_result_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission_signature form_submission_signature_key_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_key_id_fkey FOREIGN KEY (key_id) REFERENCES public.system_signing_key(id);


--
-- Name: form_submission_signature form_submission_signature_signer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_signer_user_id_fkey FOREIGN KEY (signer_user_id) REFERENCES auth.users(id);


--
-- Name: form_submission_signature form_submission_signature_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_signature
    ADD CONSTRAINT form_submission_signature_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission form_submission_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE RESTRICT;


--
-- Name: form_submission form_submission_template_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_template_version_id_fkey FOREIGN KEY (template_version_id) REFERENCES public.form_template_version(id);


--
-- Name: form_submission form_submission_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission
    ADD CONSTRAINT form_submission_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.form_submission(id) ON DELETE CASCADE;


--
-- Name: form_submission_thiet_bi form_submission_thiet_bi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_submission_thiet_bi
    ADD CONSTRAINT form_submission_thiet_bi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: form_template_he_thong form_template_he_thong_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: form_template_he_thong form_template_he_thong_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_he_thong
    ADD CONSTRAINT form_template_he_thong_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: form_template_include form_template_include_child_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_child_version_id_fkey FOREIGN KEY (child_version_id) REFERENCES public.form_template_version(id) ON DELETE RESTRICT;


--
-- Name: form_template_include form_template_include_parent_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_include
    ADD CONSTRAINT form_template_include_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES public.form_template_version(id) ON DELETE CASCADE;


--
-- Name: form_template_version form_template_version_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.form_template_version
    ADD CONSTRAINT form_template_version_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.form_template(id) ON DELETE CASCADE;


--
-- Name: gan_chuc_nang gan_chuc_nang_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_hong_hoc_id_fkey FOREIGN KEY (hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: gan_chuc_nang gan_chuc_nang_thanh_phan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_thanh_phan_id_fkey FOREIGN KEY (thanh_phan_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: gan_chuc_nang gan_chuc_nang_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_chuc_nang
    ADD CONSTRAINT gan_chuc_nang_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE RESTRICT;


--
-- Name: gan_linh_kien gan_linh_kien_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_hong_hoc_id_fkey FOREIGN KEY (hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: gan_linh_kien gan_linh_kien_khe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_khe_id_fkey FOREIGN KEY (khe_id) REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE;


--
-- Name: gan_linh_kien gan_linh_kien_linh_kien_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gan_linh_kien
    ADD CONSTRAINT gan_linh_kien_linh_kien_id_fkey FOREIGN KEY (linh_kien_id) REFERENCES public.thiet_bi(id) ON DELETE RESTRICT;


--
-- Name: giay_phep_khai_thac giay_phep_khai_thac_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep_khai_thac
    ADD CONSTRAINT giay_phep_khai_thac_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_loai_giay_phep_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_loai_giay_phep_id_fkey FOREIGN KEY (loai_giay_phep_id) REFERENCES public.dm_loai_giay_phep(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_noi_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_noi_cap_id_fkey FOREIGN KEY (noi_cap_id) REFERENCES public.dm_noi_cap(id) ON DELETE SET NULL;


--
-- Name: giay_phep giay_phep_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.giay_phep
    ADD CONSTRAINT giay_phep_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_loai_thiet_bi_yeu_cau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_loai_thiet_bi_yeu_cau_fkey FOREIGN KEY (loai_thiet_bi_yeu_cau) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_thanh_phan_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_thanh_phan_cha_fkey FOREIGN KEY (thanh_phan_cha) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_trang_thai_id_fkey FOREIGN KEY (trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: he_thong_thanh_phan he_thong_thanh_phan_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.he_thong_thanh_phan
    ADD CONSTRAINT he_thong_thanh_phan_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: import_item import_item_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.import_item
    ADD CONSTRAINT import_item_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batch(id) ON DELETE CASCADE;


--
-- Name: kho kho_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_kho_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_kho_id_fkey FOREIGN KEY (kho_id) REFERENCES public.kho(id) ON DELETE RESTRICT;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_cong_viec_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_cong_viec_id_fkey FOREIGN KEY (lien_ket_cong_viec_id) REFERENCES public.cong_viec_bao_tri(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_hong_hoc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_hong_hoc_id_fkey FOREIGN KEY (lien_ket_hong_hoc_id) REFERENCES public.hong_hoc(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_lien_ket_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_lien_ket_su_co_id_fkey FOREIGN KEY (lien_ket_su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: kho_giao_dich kho_giao_dich_vat_tu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho_giao_dich
    ADD CONSTRAINT kho_giao_dich_vat_tu_id_fkey FOREIGN KEY (vat_tu_id) REFERENCES public.vat_tu(id) ON DELETE RESTRICT;


--
-- Name: kho kho_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kho
    ADD CONSTRAINT kho_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: kiem_ke kiem_ke_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kiem_ke
    ADD CONSTRAINT kiem_ke_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_he_thong_dich_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_he_thong_dich_id_fkey FOREIGN KEY (he_thong_dich_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_he_thong_nguon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_he_thong_nguon_id_fkey FOREIGN KEY (he_thong_nguon_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;


--
-- Name: lien_ket_he_thong lien_ket_he_thong_loai_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_he_thong
    ADD CONSTRAINT lien_ket_he_thong_loai_lien_ket_id_fkey FOREIGN KEY (loai_lien_ket_id) REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT;


--
-- Name: lien_ket_khe lien_ket_khe_khe_dich_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_khe_dich_id_fkey FOREIGN KEY (khe_dich_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: lien_ket_khe lien_ket_khe_khe_nguon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_khe_nguon_id_fkey FOREIGN KEY (khe_nguon_id) REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE;


--
-- Name: lien_ket_khe lien_ket_khe_loai_lien_ket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_ket_khe
    ADD CONSTRAINT lien_ket_khe_loai_lien_ket_id_fkey FOREIGN KEY (loai_lien_ket_id) REFERENCES public.dm_loai_lien_ket(id) ON DELETE RESTRICT;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: model_tai_lieu model_tai_lieu_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_tai_lieu
    ADD CONSTRAINT model_tai_lieu_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE CASCADE;


--
-- Name: pm_cong_viec pm_cong_viec_bao_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_bao_tri_id_fkey FOREIGN KEY (bao_tri_id) REFERENCES public.bao_tri(id) ON DELETE SET NULL;


--
-- Name: pm_cong_viec pm_cong_viec_chinh_sach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_chinh_sach_id_fkey FOREIGN KEY (chinh_sach_id) REFERENCES public.bao_tri_chinh_sach(id) ON DELETE CASCADE;


--
-- Name: pm_cong_viec pm_cong_viec_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: pm_cong_viec pm_cong_viec_nguoi_phu_trach_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_cong_viec
    ADD CONSTRAINT pm_cong_viec_nguoi_phu_trach_id_fkey FOREIGN KEY (nguoi_phu_trach_id) REFERENCES public.nhan_vien(id) ON DELETE SET NULL;


--
-- Name: so_do_he_thong so_do_he_thong_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_he_thong
    ADD CONSTRAINT so_do_he_thong_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: so_do_tep_dinh_kem so_do_tep_dinh_kem_so_do_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.so_do_tep_dinh_kem
    ADD CONSTRAINT so_do_tep_dinh_kem_so_do_id_fkey FOREIGN KEY (so_do_id) REFERENCES public.so_do_he_thong(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_don_vi_giu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_don_vi_giu_id_fkey FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id);


--
-- Name: thiet_bi_cap_phat thiet_bi_cap_phat_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_cap_phat
    ADD CONSTRAINT thiet_bi_cap_phat_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_danh_gia_nien_han_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_danh_gia_nien_han_id_fkey FOREIGN KEY (danh_gia_nien_han_id) REFERENCES public.dm_danh_gia_nien_han(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_do_dac
    ADD CONSTRAINT thiet_bi_do_dac_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_don_vi_giu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_giu_id_fkey FOREIGN KEY (don_vi_giu_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_don_vi_quan_ly_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_don_vi_quan_ly_id_fkey FOREIGN KEY (don_vi_quan_ly_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_field_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_field_set_id_fkey FOREIGN KEY (field_set_id) REFERENCES public.field_set(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_den_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_den_thiet_bi_id_fkey FOREIGN KEY (den_thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_ket_noi thiet_bi_ket_noi_tu_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_ket_noi
    ADD CONSTRAINT thiet_bi_ket_noi_tu_thiet_bi_id_fkey FOREIGN KEY (tu_thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_khe_cha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_khe_cha_fkey FOREIGN KEY (khe_cha) REFERENCES public.thiet_bi_khe_linh_kien(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau_fkey FOREIGN KEY (loai_thiet_bi_yeu_cau) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_khe_linh_kien thiet_bi_khe_linh_kien_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_khe_linh_kien
    ADD CONSTRAINT thiet_bi_khe_linh_kien_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_loai_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_loai_thiet_bi_id_fkey FOREIGN KEY (loai_thiet_bi_id) REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nha_san_xuat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nha_san_xuat_id_fkey FOREIGN KEY (nha_san_xuat_id) REFERENCES public.dm_nha_san_xuat(id) ON DELETE RESTRICT;


--
-- Name: thiet_bi thiet_bi_nhom_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_nhom_he_thong_id_fkey FOREIGN KEY (nhom_he_thong_id) REFERENCES public.dm_nhom_he_thong(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_phan_loai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_phan_loai_id_fkey FOREIGN KEY (phan_loai_id) REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_tep_dinh_kem thiet_bi_tep_dinh_kem_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_tep_dinh_kem
    ADD CONSTRAINT thiet_bi_tep_dinh_kem_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi thiet_bi_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_trang_thai_id_fkey FOREIGN KEY (trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id) ON DELETE SET NULL;


--
-- Name: thiet_bi thiet_bi_vi_tri_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi
    ADD CONSTRAINT thiet_bi_vi_tri_id_fkey FOREIGN KEY (vi_tri_id) REFERENCES public.dm_vi_tri(id) ON DELETE SET NULL;


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_den_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_den_trang_thai_id_fkey FOREIGN KEY (den_trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id);


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_tu_trang_thai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thiet_bi_vong_doi
    ADD CONSTRAINT thiet_bi_vong_doi_tu_trang_thai_id_fkey FOREIGN KEY (tu_trang_thai_id) REFERENCES public.dm_trang_thai_thiet_bi(id);


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_cau_hinh
    ADD CONSTRAINT thong_bao_cau_hinh_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE CASCADE;


--
-- Name: thong_bao thong_bao_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao
    ADD CONSTRAINT thong_bao_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: thong_bao_email_queue thong_bao_email_queue_thong_bao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.thong_bao_email_queue
    ADD CONSTRAINT thong_bao_email_queue_thong_bao_id_fkey FOREIGN KEY (thong_bao_id) REFERENCES public.thong_bao(id) ON DELETE CASCADE;


--
-- Name: ticket_comment ticket_comment_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_comment
    ADD CONSTRAINT ticket_comment_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


--
-- Name: tickets tickets_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_su_co_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_su_co_id_fkey FOREIGN KEY (su_co_id) REFERENCES public.su_co(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: user_layout_prefs user_layout_prefs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_layout_prefs
    ADD CONSTRAINT user_layout_prefs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_pinned user_pinned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_pinned
    ADD CONSTRAINT user_pinned_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_recent user_recent_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_recent
    ADD CONSTRAINT user_recent_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_scope user_scope_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE CASCADE;


--
-- Name: user_scope user_scope_to_chuc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_scope
    ADD CONSTRAINT user_scope_to_chuc_id_fkey FOREIGN KEY (to_chuc_id) REFERENCES public.dm_to_chuc(id) ON DELETE CASCADE;


--
-- Name: van_de van_de_he_thong_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;


--
-- Name: van_de van_de_thiet_bi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.van_de
    ADD CONSTRAINT van_de_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_don_vi_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_don_vi_id_fkey FOREIGN KEY (don_vi_id) REFERENCES public.dm_don_vi(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.dm_model(id) ON DELETE SET NULL;


--
-- Name: vat_tu vat_tu_nha_cung_cap_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vat_tu
    ADD CONSTRAINT vat_tu_nha_cung_cap_id_fkey FOREIGN KEY (nha_cung_cap_id) REFERENCES public.dm_nha_cung_cap(id) ON DELETE SET NULL;


--
-- Name: backup_lich_su Admin ghi lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin ghi lịch sử backup" ON public.backup_lich_su FOR INSERT TO authenticated WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin sửa lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin sửa lịch sử backup" ON public.backup_lich_su FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin xem lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xem lịch sử backup" ON public.backup_lich_su FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: backup_lich_su Admin xoá lịch sử backup; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin xoá lịch sử backup" ON public.backup_lich_su FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: cay_node_edit Managers can delete node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can delete node edits" ON public.cay_node_edit FOR DELETE TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit Managers can insert node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can insert node edits" ON public.cay_node_edit FOR INSERT TO authenticated WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit Managers can update node edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers can update node edits" ON public.cay_node_edit FOR UPDATE TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_cap_phat Quản lý thiết bị ghi lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản lý thiết bị ghi lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR INSERT TO authenticated WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_cap_phat Quản trị sửa lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản trị sửa lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: thiet_bi_cap_phat Quản trị xoá lịch sử cấp phát; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Quản trị xoá lịch sử cấp phát" ON public.thiet_bi_cap_phat FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: webauthn_credentials Users can delete their own passkeys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own passkeys" ON public.webauthn_credentials FOR DELETE TO authenticated USING ((public.current_uid() = user_id));


--
-- Name: webauthn_credentials Users can view their own passkeys; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own passkeys" ON public.webauthn_credentials FOR SELECT TO authenticated USING ((public.current_uid() = user_id));


--
-- Name: bang_cot_tuy_chinh Users manage their own column prefs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users manage their own column prefs" ON public.bang_cot_tuy_chinh TO authenticated USING ((public.current_uid() = user_id)) WITH CHECK ((public.current_uid() = user_id));


--
-- Name: thiet_bi_cap_phat Xem lịch sử cấp phát theo phạm vi thiết bị; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Xem lịch sử cấp phát theo phạm vi thiết bị" ON public.thiet_bi_cap_phat FOR SELECT TO authenticated USING (public.can_view_thiet_bi(thiet_bi_id, public.current_uid()));


--
-- Name: access_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.access_request ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set admin manage field_set; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage field_set" ON public.field_set TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: field_set_item admin manage field_set_item; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage field_set_item" ON public.field_set_item TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: he_thong_truong admin manage he_thong_truong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin manage he_thong_truong" ON public.he_thong_truong TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: cay_thay_doi admin update cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "admin update cay_thay_doi" ON public.cay_thay_doi FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: auth_event_log ae_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ae_read ON public.auth_event_log FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR (target_user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: ai_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_config ai_config_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_config_admin_all ON public.ai_config TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: ai_conversation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_conversation ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_conversation ai_conversation_owner_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_conversation_owner_all ON public.ai_conversation TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK ((public.current_uid() = user_id));


--
-- Name: ai_message; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_message ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_message ai_message_owner_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ai_message_owner_all ON public.ai_message TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.ai_conversation c
  WHERE ((c.id = ai_message.conversation_id) AND ((c.user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.ai_conversation c
  WHERE ((c.id = ai_message.conversation_id) AND (c.user_id = public.current_uid())))));


--
-- Name: anomaly_alert an_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY an_admin_update ON public.anomaly_alert FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: anomaly_alert an_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY an_read ON public.anomaly_alert FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_delete_owner_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_delete_owner_or_admin ON public.bao_cao_annotation FOR DELETE TO authenticated USING (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_insert_kt_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_insert_kt_admin ON public.bao_cao_annotation FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: bao_cao_annotation annotation_select_all_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_select_all_auth ON public.bao_cao_annotation FOR SELECT TO authenticated USING (true);


--
-- Name: bao_cao_annotation annotation_update_owner_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY annotation_update_owner_or_admin ON public.bao_cao_annotation FOR UPDATE TO authenticated USING (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))) WITH CHECK (((tao_boi = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: anomaly_alert; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.anomaly_alert ENABLE ROW LEVEL SECURITY;

--
-- Name: app_cai_dat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.app_cai_dat ENABLE ROW LEVEL SECURITY;

--
-- Name: app_cai_dat app_cai_dat_admin_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_delete ON public.app_cai_dat FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_admin_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_insert ON public.app_cai_dat FOR INSERT TO authenticated WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_admin_update ON public.app_cai_dat FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: app_cai_dat app_cai_dat_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY app_cai_dat_read_mgr ON public.app_cai_dat FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: access_request ar_admin_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_admin_update ON public.access_request FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: access_request ar_owner_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_owner_insert ON public.access_request FOR INSERT TO authenticated WITH CHECK ((user_id = public.current_uid()));


--
-- Name: access_request ar_owner_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ar_owner_read ON public.access_request FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: audit_log audit_admin_kt_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_admin_kt_select_all ON public.audit_log FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_self_select ON public.audit_log FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: audit_log audit_system_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_system_insert ON public.audit_log FOR INSERT TO authenticated WITH CHECK (((user_id IS NULL) OR (user_id = public.current_uid())));


--
-- Name: auth_event_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auth_event_log ENABLE ROW LEVEL SECURITY;

--
-- Name: backup_lich_su; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.backup_lich_su ENABLE ROW LEVEL SECURITY;

--
-- Name: ban_giao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ban_giao ENABLE ROW LEVEL SECURITY;

--
-- Name: ban_giao ban_giao_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ban_giao_select ON public.ban_giao FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: ban_giao ban_giao_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ban_giao_write ON public.ban_giao TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: bang_cot_tuy_chinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bang_cot_tuy_chinh ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_cao_annotation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_cao_annotation ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri_chinh_sach; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bao_tri_chinh_sach ENABLE ROW LEVEL SECURITY;

--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_chinh_sach_select ON public.bao_tri_chinh_sach FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: bao_tri_chinh_sach bao_tri_chinh_sach_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_chinh_sach_write ON public.bao_tri_chinh_sach USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: bao_tri bao_tri_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_select ON public.bao_tri FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: bao_tri bao_tri_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY bao_tri_write ON public.bao_tri TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: canh_bao_het_han_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.canh_bao_het_han_log ENABLE ROW LEVEL SECURITY;

--
-- Name: canh_bao_het_han_log canh_bao_log_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY canh_bao_log_read ON public.canh_bao_het_han_log FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: cay_node_edit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cay_node_edit ENABLE ROW LEVEL SECURITY;

--
-- Name: cay_node_edit cay_node_edit_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cay_node_edit_select ON public.cay_node_edit FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid())));


--
-- Name: cay_thay_doi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cay_thay_doi ENABLE ROW LEVEL SECURITY;

--
-- Name: change_request; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.change_request ENABLE ROW LEVEL SECURITY;

--
-- Name: chung_chi_thiet_bi chung_chi_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chung_chi_read ON public.chung_chi_thiet_bi FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = chung_chi_thiet_bi.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: chung_chi_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chung_chi_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: chung_chi_thiet_bi chung_chi_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chung_chi_write ON public.chung_chi_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: cong_viec_bao_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cong_viec_bao_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations conv_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_insert_self ON public.conversations FOR INSERT TO authenticated WITH CHECK ((created_by = public.current_uid()));


--
-- Name: conversations conv_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_select_participant ON public.conversations FOR SELECT TO authenticated USING (((created_by = public.current_uid()) OR public.is_conv_participant(id, public.current_uid())));


--
-- Name: conversations conv_update_creator; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY conv_update_creator ON public.conversations FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.is_conv_participant(id, public.current_uid())));


--
-- Name: conversation_participant; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversation_participant ENABLE ROW LEVEL SECURITY;

--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

--
-- Name: conversation_participant cp_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_delete_own ON public.conversation_participant FOR DELETE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: conversation_participant cp_insert_self_or_creator; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_insert_self_or_creator ON public.conversation_participant FOR INSERT TO authenticated WITH CHECK (((user_id = public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.conversations c
  WHERE ((c.id = conversation_participant.conversation_id) AND (c.created_by = public.current_uid()))))));


--
-- Name: conversation_participant cp_select_own_convs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_select_own_convs ON public.conversation_participant FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.is_conv_participant(conversation_id, public.current_uid())));


--
-- Name: conversation_participant cp_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cp_update_own ON public.conversation_participant FOR UPDATE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: change_request cr_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_insert ON public.change_request FOR INSERT TO authenticated WITH CHECK (((nguoi_tao = auth.uid()) AND (trang_thai = 'pending'::public.change_request_status) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role))));


--
-- Name: change_request cr_no_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_no_delete ON public.change_request FOR DELETE TO authenticated USING (false);


--
-- Name: change_request cr_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_select ON public.change_request FOR SELECT TO authenticated USING (((nguoi_tao = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role)));


--
-- Name: change_request cr_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cr_update ON public.change_request FOR UPDATE TO authenticated USING (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (nguoi_tao <> auth.uid())) OR ((nguoi_tao = auth.uid()) AND (trang_thai = 'pending'::public.change_request_status)))) WITH CHECK (((public.has_role(auth.uid(), 'admin'::public.app_role) AND (nguoi_tao <> auth.uid())) OR ((nguoi_tao = auth.uid()) AND (trang_thai = ANY (ARRAY['pending'::public.change_request_status, 'cancelled'::public.change_request_status])))));


--
-- Name: du_an_cong_viec cv_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_delete ON public.du_an_cong_viec FOR DELETE TO authenticated USING ((public.can_manage_du_an(du_an_id, public.current_uid()) OR (created_by = public.current_uid())));


--
-- Name: du_an_cong_viec cv_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_insert ON public.du_an_cong_viec FOR INSERT TO authenticated WITH CHECK ((public.can_manage_du_an(du_an_id, public.current_uid()) OR public.has_role(public.current_uid(), 'to_truong'::public.app_role) OR public.has_role(public.current_uid(), 'quan_ly_du_an'::public.app_role)));


--
-- Name: du_an_cong_viec cv_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_select ON public.du_an_cong_viec FOR SELECT TO authenticated USING (public.can_access_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_cong_viec cv_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cv_update ON public.du_an_cong_viec FOR UPDATE TO authenticated USING (public.can_edit_cong_viec(id, public.current_uid())) WITH CHECK (public.can_edit_cong_viec(id, public.current_uid()));


--
-- Name: cong_viec_bao_tri cvbt_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cvbt_select ON public.cong_viec_bao_tri FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: cong_viec_bao_tri cvbt_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cvbt_write ON public.cong_viec_bao_tri TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dinh_nghia_truong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dinh_nghia_truong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_dac_tinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_dac_tinh ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_dac_tinh dm_dac_tinh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_dac_tinh_read_active ON public.dm_dac_tinh FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_dac_tinh dm_dac_tinh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_dac_tinh_write_manager ON public.dm_dac_tinh USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_danh_gia_nien_han; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_danh_gia_nien_han ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_don_vi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_don_vi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_he_thong dm_he_thong_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_he_thong_read_scope ON public.dm_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: dm_loai_giay_phep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_giay_phep ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_loai_lien_ket; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_lien_ket ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_loai_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_loai_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_model ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model_dac_tinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_model_dac_tinh ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_model_dac_tinh_read_active ON public.dm_model_dac_tinh FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_model_dac_tinh dm_model_dac_tinh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dm_model_dac_tinh_write_manager ON public.dm_model_dac_tinh USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_cung_cap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nha_cung_cap ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_nha_san_xuat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nha_san_xuat ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_nhom_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_nhom_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_noi_cap; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_noi_cap ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_phan_loai; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_phan_loai ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_to_chuc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_to_chuc ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_trang_thai_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_trang_thai_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: dm_vi_tri; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dm_vi_tri ENABLE ROW LEVEL SECURITY;

--
-- Name: dinh_nghia_truong dnt_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dnt_read_mgr ON public.dinh_nghia_truong FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: dinh_nghia_truong dnt_write_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dnt_write_admin ON public.dinh_nghia_truong TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: du_an; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_viec; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_viec ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_cong_viec_phoi_hop; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_cong_viec_phoi_hop ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an du_an_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_delete ON public.du_an FOR DELETE TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR (nguoi_tao_id = public.current_uid())));


--
-- Name: du_an du_an_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_insert ON public.du_an FOR INSERT TO authenticated WITH CHECK (((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'quan_ly_du_an'::public.app_role)) AND (nguoi_tao_id = public.current_uid())));


--
-- Name: du_an_moc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.du_an_moc ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an du_an_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_select ON public.du_an FOR SELECT TO authenticated USING (public.can_access_du_an(id, public.current_uid()));


--
-- Name: du_an du_an_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY du_an_update ON public.du_an FOR UPDATE TO authenticated USING (public.can_manage_du_an(id, public.current_uid())) WITH CHECK (public.can_manage_du_an(id, public.current_uid()));


--
-- Name: feature_usage_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feature_usage_log ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.field_set ENABLE ROW LEVEL SECURITY;

--
-- Name: field_set_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.field_set_item ENABLE ROW LEVEL SECURITY;

--
-- Name: form_check_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_check_item ENABLE ROW LEVEL SECURITY;

--
-- Name: form_check_item form_check_item_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_check_item_manage_kt ON public.form_check_item TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_check_item form_check_item_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_check_item_select_active ON public.form_check_item FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_field; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_field ENABLE ROW LEVEL SECURITY;

--
-- Name: form_field form_field_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_manage_kt ON public.form_field TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_field form_field_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_field_select_active ON public.form_field FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_section; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_section ENABLE ROW LEVEL SECURITY;

--
-- Name: form_section form_section_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_section_manage_kt ON public.form_section TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_section form_section_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_section_select_active ON public.form_section FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_sign_otp; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_sign_otp ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission_thiet_bi form_sub_tb_select_by_parent; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_sub_tb_select_by_parent ON public.form_submission_thiet_bi FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (s.created_by = public.current_uid()) OR ((s.status <> 'draft'::public.form_submission_status) AND (s.don_vi_id IS NOT NULL) AND (s.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: form_submission_thiet_bi form_sub_tb_write_by_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_sub_tb_write_by_owner ON public.form_submission_thiet_bi TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND (((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'returned'::public.form_submission_status]))) OR public.can_manage_equipment(public.current_uid())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_thiet_bi.submission_id) AND (((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))) OR public.can_manage_equipment(public.current_uid()))))));


--
-- Name: form_submission; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_delete_own_draft; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_delete_own_draft ON public.form_submission FOR DELETE TO authenticated USING ((((created_by = public.current_uid()) AND (status = 'draft'::public.form_submission_status)) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: form_submission form_submission_insert_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_insert_own ON public.form_submission FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid())));


--
-- Name: form_submission_item_result; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_item_result ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_select_scope ON public.form_submission FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((status <> 'draft'::public.form_submission_status) AND (don_vi_id IS NOT NULL) AND (don_vi_id = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: form_submission_signature; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_signature ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission_thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_submission_thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: form_submission form_submission_update_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_update_kt ON public.form_submission FOR UPDATE TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_submission form_submission_update_own_draft; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_submission_update_own_draft ON public.form_submission FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) AND (status = ANY (ARRAY['draft'::public.form_submission_status, 'returned'::public.form_submission_status])))) WITH CHECK (((created_by = public.current_uid()) AND (status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))));


--
-- Name: form_template; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_include; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_include ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template form_template_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_template_manage_kt ON public.form_template TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template form_template_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_template_select_active ON public.form_template FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_template_version; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.form_template_version ENABLE ROW LEVEL SECURITY;

--
-- Name: form_template_he_thong form_tpl_ht_manage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_tpl_ht_manage ON public.form_template_he_thong USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_he_thong form_tpl_ht_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY form_tpl_ht_select ON public.form_template_he_thong FOR SELECT USING (public.is_active_user(public.current_uid()));


--
-- Name: form_submission_item_result fsir_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fsir_select_scope ON public.form_submission_item_result FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (s.created_by = public.current_uid()) OR ((s.status <> 'draft'::public.form_submission_status) AND (s.don_vi_id IS NOT NULL) AND (s.don_vi_id = public.get_user_don_vi_id(public.current_uid()))))))));


--
-- Name: form_submission_item_result fsir_write_owner_or_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fsir_write_owner_or_kt ON public.form_submission_item_result TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND (public.can_manage_equipment(public.current_uid()) OR ((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status])))))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE ((s.id = form_submission_item_result.submission_id) AND (public.can_manage_equipment(public.current_uid()) OR ((s.created_by = public.current_uid()) AND (s.status = ANY (ARRAY['draft'::public.form_submission_status, 'submitted'::public.form_submission_status, 'returned'::public.form_submission_status]))))))));


--
-- Name: form_submission_signature fss_read_via_submission; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fss_read_via_submission ON public.form_submission_signature FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.form_submission s
  WHERE (s.id = form_submission_signature.submission_id))));


--
-- Name: form_submission_signature fss_write_service_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fss_write_service_only ON public.form_submission_signature FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: form_template_include ftinc_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftinc_manage_kt ON public.form_template_include TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_include ftinc_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftinc_select_active ON public.form_template_include FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: form_template_version ftv_manage_kt; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftv_manage_kt ON public.form_template_version TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: form_template_version ftv_select_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY ftv_select_active ON public.form_template_version FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: feature_usage_log fu_owner_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY fu_owner_read ON public.feature_usage_log FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: gan_chuc_nang; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gan_chuc_nang ENABLE ROW LEVEL SECURITY;

--
-- Name: gan_linh_kien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.gan_linh_kien ENABLE ROW LEVEL SECURITY;

--
-- Name: gan_chuc_nang gcn_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gcn_select ON public.gan_chuc_nang FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: gan_chuc_nang gcn_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gcn_write_manager ON public.gan_chuc_nang TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: giay_phep; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.giay_phep ENABLE ROW LEVEL SECURITY;

--
-- Name: giay_phep_khai_thac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.giay_phep_khai_thac ENABLE ROW LEVEL SECURITY;

--
-- Name: giay_phep giay_phep_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY giay_phep_read_scope ON public.giay_phep FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = giay_phep.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: giay_phep giay_phep_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY giay_phep_write_manager ON public.giay_phep TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: gan_linh_kien glk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY glk_select ON public.gan_linh_kien FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(linh_kien_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: gan_linh_kien glk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY glk_write_manager ON public.gan_linh_kien USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: giay_phep_khai_thac gpkt_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gpkt_read_scope ON public.giay_phep_khai_thac FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (he_thong_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.dm_he_thong h
  WHERE ((h.id = giay_phep_khai_thac.he_thong_id) AND ((h.don_vi_id IS NULL) OR (h.don_vi_id = public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: giay_phep_khai_thac gpkt_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY gpkt_write_manager ON public.giay_phep_khai_thac TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: he_thong_thanh_phan; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.he_thong_thanh_phan ENABLE ROW LEVEL SECURITY;

--
-- Name: he_thong_truong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.he_thong_truong ENABLE ROW LEVEL SECURITY;

--
-- Name: hong_hoc; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.hong_hoc ENABLE ROW LEVEL SECURITY;

--
-- Name: hong_hoc hong_hoc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hong_hoc_select ON public.hong_hoc FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_hong_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_hong_id, public.current_uid())))));


--
-- Name: hong_hoc hong_hoc_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY hong_hoc_write ON public.hong_hoc TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: he_thong_thanh_phan htp_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY htp_select ON public.he_thong_thanh_phan FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: he_thong_thanh_phan htp_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY htp_write_manager ON public.he_thong_thanh_phan USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: import_alias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_alias ENABLE ROW LEVEL SECURITY;

--
-- Name: import_alias import_alias_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_delete ON public.import_alias FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: import_alias import_alias_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_insert ON public.import_alias FOR INSERT TO authenticated WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) AND (confirmed_by = public.current_uid())));


--
-- Name: import_alias import_alias_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_select ON public.import_alias FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: import_alias import_alias_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_alias_update ON public.import_alias FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: import_batch; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_batch ENABLE ROW LEVEL SECURITY;

--
-- Name: import_batch import_batch_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_delete ON public.import_batch FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: import_batch import_batch_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_insert ON public.import_batch FOR INSERT TO authenticated WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) AND (created_by = public.current_uid())));


--
-- Name: import_batch import_batch_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_select ON public.import_batch FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND ((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role))));


--
-- Name: import_batch import_batch_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_batch_update ON public.import_batch FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK (((created_by = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: import_item; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.import_item ENABLE ROW LEVEL SECURITY;

--
-- Name: import_item import_item_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_item_select ON public.import_item FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND public.can_view_import_batch(batch_id, public.current_uid())));


--
-- Name: import_item import_item_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY import_item_write ON public.import_item TO authenticated USING (public.can_view_import_batch(batch_id, public.current_uid())) WITH CHECK (public.can_view_import_batch(batch_id, public.current_uid()));


--
-- Name: cay_thay_doi insert cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "insert cay_thay_doi" ON public.cay_thay_doi FOR INSERT TO authenticated WITH CHECK ((public.can_manage_equipment(public.current_uid()) AND (nguoi_tao = public.current_uid())));


--
-- Name: kho_giao_dich kgd_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kgd_insert ON public.kho_giao_dich FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: kho_giao_dich kgd_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kgd_select ON public.kho_giao_dich FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: thiet_bi_khe_linh_kien khe_lk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY khe_lk_select ON public.thiet_bi_khe_linh_kien FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_khe_linh_kien khe_lk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY khe_lk_write_manager ON public.thiet_bi_khe_linh_kien USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: kho; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kho ENABLE ROW LEVEL SECURITY;

--
-- Name: kho_giao_dich; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kho_giao_dich ENABLE ROW LEVEL SECURITY;

--
-- Name: kho kho_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kho_select ON public.kho FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: kho kho_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kho_write ON public.kho USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: kiem_ke; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kiem_ke ENABLE ROW LEVEL SECURITY;

--
-- Name: kiem_ke kiem_ke_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kiem_ke_select ON public.kiem_ke FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: kiem_ke kiem_ke_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY kiem_ke_write ON public.kiem_ke TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))) WITH CHECK ((public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid())));


--
-- Name: lien_ket_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lien_ket_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: lien_ket_khe; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lien_ket_khe ENABLE ROW LEVEL SECURITY;

--
-- Name: lien_ket_he_thong lkht_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkht_select ON public.lien_ket_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: lien_ket_he_thong lkht_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkht_write_manager ON public.lien_ket_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: lien_ket_khe lkk_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkk_select ON public.lien_ket_khe FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: lien_ket_khe lkk_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lkk_write_manager ON public.lien_ket_khe TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_lien_ket llk_lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llk_lookup_read_active ON public.dm_loai_lien_ket FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_lien_ket llk_lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY llk_lookup_write_manager ON public.dm_loai_lien_ket TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_don_vi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_don_vi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_giay_phep lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_loai_giay_phep FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_loai_thiet_bi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_loai_thiet_bi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_model lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_model FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nha_cung_cap lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nha_cung_cap FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nha_san_xuat lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nha_san_xuat FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_nhom_he_thong lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_nhom_he_thong FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_noi_cap lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_noi_cap FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_phan_loai lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_phan_loai FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_trang_thai_thiet_bi lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_trang_thai_thiet_bi FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_vi_tri lookup_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_read_active ON public.dm_vi_tri FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_don_vi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_don_vi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_he_thong lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_giay_phep lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_loai_giay_phep TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_loai_thiet_bi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_loai_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_model lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_model TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_cung_cap lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nha_cung_cap TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nha_san_xuat lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nha_san_xuat TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_nhom_he_thong lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_nhom_he_thong TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_noi_cap lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_noi_cap TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_phan_loai lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_phan_loai TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_trang_thai_thiet_bi lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_trang_thai_thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: dm_vi_tri lookup_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lookup_write_manager ON public.dm_vi_tri TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: du_an_moc moc_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_delete ON public.du_an_moc FOR DELETE TO authenticated USING (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_insert ON public.du_an_moc FOR INSERT TO authenticated WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_select ON public.du_an_moc FOR SELECT TO authenticated USING (public.can_access_du_an(du_an_id, public.current_uid()));


--
-- Name: du_an_moc moc_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY moc_update ON public.du_an_moc FOR UPDATE TO authenticated USING (public.can_manage_du_an(du_an_id, public.current_uid())) WITH CHECK (public.can_manage_du_an(du_an_id, public.current_uid()));


--
-- Name: model_tai_lieu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.model_tai_lieu ENABLE ROW LEVEL SECURITY;

--
-- Name: model_tai_lieu model_tai_lieu quan ly; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "model_tai_lieu quan ly" ON public.model_tai_lieu TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: model_tai_lieu model_tai_lieu_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY model_tai_lieu_select ON public.model_tai_lieu FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: messages msg_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_delete_own ON public.messages FOR DELETE TO authenticated USING ((sender_id = public.current_uid()));


--
-- Name: messages msg_insert_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_insert_participant ON public.messages FOR INSERT TO authenticated WITH CHECK (((sender_id = public.current_uid()) AND public.is_conv_participant(conversation_id, public.current_uid())));


--
-- Name: messages msg_select_participant; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY msg_select_participant ON public.messages FOR SELECT TO authenticated USING (public.is_conv_participant(conversation_id, public.current_uid()));


--
-- Name: dm_danh_gia_nien_han nh_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nh_read_active ON public.dm_danh_gia_nien_han FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_danh_gia_nien_han nh_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nh_write_manager ON public.dm_danh_gia_nien_han TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: nhan_vien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nhan_vien ENABLE ROW LEVEL SECURITY;

--
-- Name: nhan_vien nhan_vien write admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "nhan_vien write admin" ON public.nhan_vien TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: nhan_vien nhan_vien_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY nhan_vien_select ON public.nhan_vien FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: node_note; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.node_note ENABLE ROW LEVEL SECURITY;

--
-- Name: node_note node_note_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_delete_admin ON public.node_note FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: node_note node_note_insert_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_insert_auth ON public.node_note FOR INSERT TO authenticated WITH CHECK (((public.current_uid() IS NOT NULL) AND (updated_by = public.current_uid())));


--
-- Name: node_note node_note_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_select ON public.node_note FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: node_note node_note_update_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY node_note_update_auth ON public.node_note FOR UPDATE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (updated_by = public.current_uid()))) WITH CHECK ((updated_by = public.current_uid()));


--
-- Name: notifications notif_delete_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_delete_own ON public.notifications FOR DELETE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications notif_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_select_own ON public.notifications FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications notif_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notif_update_own ON public.notifications FOR UPDATE TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: form_sign_otp otp_own_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_insert ON public.form_sign_otp FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: form_sign_otp otp_own_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_select ON public.form_sign_otp FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: form_sign_otp otp_own_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY otp_own_update ON public.form_sign_otp FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned delete" ON public.user_pinned FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned insert" ON public.user_pinned FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned select" ON public.user_pinned FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_pinned own pinned update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own pinned update" ON public.user_pinned FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs delete" ON public.user_layout_prefs FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs insert" ON public.user_layout_prefs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs select" ON public.user_layout_prefs FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_layout_prefs own prefs update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own prefs update" ON public.user_layout_prefs FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_recent own recent delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent delete" ON public.user_recent FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_recent own recent insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent insert" ON public.user_recent FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_recent own recent select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent select" ON public.user_recent FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: user_recent own recent update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "own recent update" ON public.user_recent FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));


--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_delete ON public.du_an_cong_viec_phoi_hop FOR DELETE TO authenticated USING (public.can_edit_cong_viec(cong_viec_id, public.current_uid()));


--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_insert ON public.du_an_cong_viec_phoi_hop FOR INSERT TO authenticated WITH CHECK (public.can_edit_cong_viec(cong_viec_id, public.current_uid()));


--
-- Name: du_an_cong_viec_phoi_hop phoi_hop_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY phoi_hop_select ON public.du_an_cong_viec_phoi_hop FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.du_an_cong_viec c
  WHERE ((c.id = du_an_cong_viec_phoi_hop.cong_viec_id) AND public.can_access_du_an(c.du_an_id, public.current_uid()))))));


--
-- Name: pm_cong_viec; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pm_cong_viec ENABLE ROW LEVEL SECURITY;

--
-- Name: pm_cong_viec pm_cv_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_cv_select ON public.pm_cong_viec FOR SELECT TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))));


--
-- Name: pm_cong_viec pm_cv_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY pm_cv_update ON public.pm_cong_viec FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid()))))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'phong_kt'::public.app_role) OR (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_admin_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_admin_select_all ON public.profiles FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: profiles profiles_admin_update_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_admin_update_all ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: profiles profiles_self_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK ((id = public.current_uid()));


--
-- Name: profiles profiles_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_select ON public.profiles FOR SELECT TO authenticated USING ((id = public.current_uid()));


--
-- Name: profiles profiles_self_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_self_update ON public.profiles FOR UPDATE USING ((id = public.current_uid())) WITH CHECK ((id = public.current_uid()));


--
-- Name: cay_thay_doi read cay_thay_doi; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read cay_thay_doi" ON public.cay_thay_doi FOR SELECT TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (nguoi_tao = public.current_uid())));


--
-- Name: field_set read field_set; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read field_set" ON public.field_set FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: field_set_item read field_set_item; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read field_set_item" ON public.field_set_item FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: he_thong_truong read he_thong_truong; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "read he_thong_truong" ON public.he_thong_truong FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: role_permission role_perm_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_perm_admin_write ON public.role_permission TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: role_permission role_perm_read_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY role_perm_read_admin ON public.role_permission FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: role_permission; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permission ENABLE ROW LEVEL SECURITY;

--
-- Name: search_index; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;

--
-- Name: search_index search_index_read_mgr; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY search_index_read_mgr ON public.search_index FOR SELECT TO authenticated USING (public.can_manage_equipment(public.current_uid()));


--
-- Name: system_signing_key signing_key_service_role_only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY signing_key_service_role_only ON public.system_signing_key USING (false) WITH CHECK (false);


--
-- Name: so_do_he_thong so_do_delete_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_delete_scope ON public.so_do_he_thong FOR DELETE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid())))));


--
-- Name: so_do_he_thong; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_he_thong ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_he_thong so_do_insert_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_insert_scope ON public.so_do_he_thong FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))));


--
-- Name: so_do_he_thong so_do_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_read_scope ON public.so_do_he_thong FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))));


--
-- Name: so_do_tep_dinh_kem so_do_tep_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_delete ON public.so_do_tep_dinh_kem FOR DELETE TO authenticated USING ((public.can_access_so_do(so_do_id, public.current_uid()) AND ((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid()))));


--
-- Name: so_do_tep_dinh_kem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_tep_dinh_kem so_do_tep_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_insert ON public.so_do_tep_dinh_kem FOR INSERT TO authenticated WITH CHECK (((created_by = public.current_uid()) AND public.can_access_so_do(so_do_id, public.current_uid())));


--
-- Name: so_do_tep_dinh_kem so_do_tep_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_tep_read ON public.so_do_tep_dinh_kem FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND public.can_access_so_do(so_do_id, public.current_uid())));


--
-- Name: so_do_thu_vien_hinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.so_do_thu_vien_hinh ENABLE ROW LEVEL SECURITY;

--
-- Name: so_do_he_thong so_do_update_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY so_do_update_scope ON public.so_do_he_thong FOR UPDATE TO authenticated USING ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid()))))) WITH CHECK ((public.can_manage_equipment(public.current_uid()) OR (created_by = public.current_uid()) OR ((don_vi_ma IS NOT NULL) AND (don_vi_ma = public.get_user_don_vi_ma(public.current_uid())))));


--
-- Name: su_co; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.su_co ENABLE ROW LEVEL SECURITY;

--
-- Name: su_co_lich_su; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.su_co_lich_su ENABLE ROW LEVEL SECURITY;

--
-- Name: su_co_lich_su su_co_lich_su_no_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_lich_su_no_write ON public.su_co_lich_su TO authenticated USING (false) WITH CHECK (false);


--
-- Name: su_co_lich_su su_co_lich_su_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_lich_su_select ON public.su_co_lich_su FOR SELECT TO authenticated USING (true);


--
-- Name: su_co su_co_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_select ON public.su_co FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())))));


--
-- Name: su_co su_co_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY su_co_write ON public.su_co TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role))) WITH CHECK ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: system_signing_key; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_signing_key ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_ket_noi tbkn_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_insert ON public.thiet_bi_ket_noi FOR INSERT WITH CHECK ((public.is_active_user(public.current_uid()) AND public.can_view_thiet_bi(tu_thiet_bi_id, public.current_uid()) AND public.can_view_thiet_bi(den_thiet_bi_id, public.current_uid())));


--
-- Name: thiet_bi_ket_noi tbkn_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_select ON public.thiet_bi_ket_noi FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(tu_thiet_bi_id, public.current_uid()) OR public.can_view_thiet_bi(den_thiet_bi_id, public.current_uid()) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: thiet_bi_ket_noi tbkn_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tbkn_write_manager ON public.thiet_bi_ket_noi USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: ticket_comment tc_delete_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_delete_own_or_admin ON public.ticket_comment FOR DELETE TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: ticket_comment tc_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_insert ON public.ticket_comment FOR INSERT TO authenticated WITH CHECK (((user_id = public.current_uid()) AND public.can_access_ticket(ticket_id, public.current_uid())));


--
-- Name: ticket_comment tc_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tc_select ON public.ticket_comment FOR SELECT TO authenticated USING (public.can_access_ticket(ticket_id, public.current_uid()));


--
-- Name: telegram_da_gui tele_dagui_select_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_dagui_select_admin ON public.telegram_da_gui FOR SELECT TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: telegram_subscriber tele_sub_delete_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_delete_own_or_admin ON public.telegram_subscriber FOR DELETE TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_insert_self_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_insert_self_or_admin ON public.telegram_subscriber FOR INSERT TO authenticated WITH CHECK (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_select_own_or_admin ON public.telegram_subscriber FOR SELECT TO authenticated USING (((public.current_uid() = user_id) OR (public.current_uid() = created_by) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_subscriber tele_sub_update_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tele_sub_update_own_or_admin ON public.telegram_subscriber FOR UPDATE TO authenticated USING (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role))) WITH CHECK (((public.current_uid() = user_id) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: telegram_da_gui; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_da_gui ENABLE ROW LEVEL SECURITY;

--
-- Name: telegram_subscriber; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.telegram_subscriber ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_tep_dinh_kem tep_select_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tep_select_scope ON public.thiet_bi_tep_dinh_kem FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (EXISTS ( SELECT 1
   FROM public.thiet_bi tb
  WHERE ((tb.id = thiet_bi_tep_dinh_kem.thiet_bi_id) AND (NOT (tb.don_vi_quan_ly_id IS DISTINCT FROM public.get_user_don_vi_id(public.current_uid())))))))));


--
-- Name: thiet_bi_tep_dinh_kem tep_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tep_write_manager ON public.thiet_bi_tep_dinh_kem TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_cap_phat; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_cap_phat ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_do_dac; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_do_dac ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_do_dac_select ON public.thiet_bi_do_dac FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_do_dac thiet_bi_do_dac_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_do_dac_write ON public.thiet_bi_do_dac USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi_ket_noi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_ket_noi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_khe_linh_kien; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_khe_linh_kien ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi thiet_bi_read_scope; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_read_scope ON public.thiet_bi FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_quan_ly_id = public.get_user_don_vi_id(public.current_uid())) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: thiet_bi_tep_dinh_kem; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_tep_dinh_kem ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_vong_doi; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thiet_bi_vong_doi ENABLE ROW LEVEL SECURITY;

--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_vong_doi_select ON public.thiet_bi_vong_doi FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR public.can_view_thiet_bi(thiet_bi_id, public.current_uid()))));


--
-- Name: thiet_bi_vong_doi thiet_bi_vong_doi_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_vong_doi_write ON public.thiet_bi_vong_doi USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thiet_bi thiet_bi_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thiet_bi_write_manager ON public.thiet_bi TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: thong_bao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_cau_hinh; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao_cau_hinh ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_cau_hinh_read ON public.thong_bao_cau_hinh FOR SELECT TO authenticated USING (true);


--
-- Name: thong_bao_cau_hinh thong_bao_cau_hinh_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_cau_hinh_write ON public.thong_bao_cau_hinh TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: thong_bao_email_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.thong_bao_email_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: thong_bao_email_queue thong_bao_email_queue_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_email_queue_admin ON public.thong_bao_email_queue FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: thong_bao thong_bao_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_select ON public.thong_bao FOR SELECT TO authenticated USING (((nguoi_nhan = auth.uid()) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: thong_bao thong_bao_update_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thong_bao_update_read ON public.thong_bao FOR UPDATE TO authenticated USING (((nguoi_nhan = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid())))))) WITH CHECK (((nguoi_nhan = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR ((nguoi_nhan IS NULL) AND (don_vi_id IN ( SELECT user_scope.don_vi_id
   FROM public.user_scope
  WHERE (user_scope.user_id = auth.uid()))))));


--
-- Name: so_do_thu_vien_hinh thu_vien_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_delete ON public.so_do_thu_vien_hinh FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: so_do_thu_vien_hinh thu_vien_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_insert ON public.so_do_thu_vien_hinh FOR INSERT TO authenticated WITH CHECK ((public.is_active_user(public.current_uid()) AND (created_by = public.current_uid())));


--
-- Name: so_do_thu_vien_hinh thu_vien_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY thu_vien_read ON public.so_do_thu_vien_hinh FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: ticket_comment; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ticket_comment ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

--
-- Name: tickets tickets_delete_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_delete_admin ON public.tickets FOR DELETE TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: tickets tickets_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_insert_self ON public.tickets FOR INSERT TO authenticated WITH CHECK ((created_by = public.current_uid()));


--
-- Name: tickets tickets_select_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_select_own_or_admin ON public.tickets FOR SELECT TO authenticated USING (((created_by = public.current_uid()) OR (assigned_to = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: tickets tickets_update_own_or_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tickets_update_own_or_admin ON public.tickets FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR (assigned_to = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role)));


--
-- Name: dm_to_chuc to_chuc_read_active; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY to_chuc_read_active ON public.dm_to_chuc FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: dm_to_chuc to_chuc_write_manager; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY to_chuc_write_manager ON public.dm_to_chuc TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: user_layout_prefs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_layout_prefs ENABLE ROW LEVEL SECURITY;

--
-- Name: user_pinned; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_pinned ENABLE ROW LEVEL SECURITY;

--
-- Name: user_recent; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_recent ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles user_roles_admin_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_all ON public.user_roles TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: user_roles user_roles_admin_select_all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_admin_select_all ON public.user_roles FOR SELECT TO authenticated USING ((public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: user_roles user_roles_self_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_roles_self_select ON public.user_roles FOR SELECT TO authenticated USING ((user_id = public.current_uid()));


--
-- Name: user_scope; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_scope ENABLE ROW LEVEL SECURITY;

--
-- Name: user_scope user_scope_admin_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_scope_admin_write ON public.user_scope TO authenticated USING (public.has_role(public.current_uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(public.current_uid(), 'admin'::public.app_role));


--
-- Name: user_scope user_scope_self_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY user_scope_self_read ON public.user_scope FOR SELECT TO authenticated USING (((user_id = public.current_uid()) OR public.has_role(public.current_uid(), 'admin'::public.app_role) OR public.has_role(public.current_uid(), 'phong_kt'::public.app_role)));


--
-- Name: van_de; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.van_de ENABLE ROW LEVEL SECURITY;

--
-- Name: van_de van_de_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY van_de_select ON public.van_de FOR SELECT TO authenticated USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR ((thiet_bi_id IS NOT NULL) AND public.can_view_thiet_bi(thiet_bi_id, public.current_uid())) OR ((don_vi_id_snapshot IS NOT NULL) AND (don_vi_id_snapshot = public.get_user_don_vi_id(public.current_uid()))))));


--
-- Name: van_de van_de_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY van_de_write ON public.van_de TO authenticated USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: vat_tu; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vat_tu ENABLE ROW LEVEL SECURITY;

--
-- Name: vat_tu vat_tu_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vat_tu_select ON public.vat_tu FOR SELECT USING ((public.is_active_user(public.current_uid()) AND (public.can_manage_equipment(public.current_uid()) OR (don_vi_id IS NULL) OR (don_vi_id = public.get_user_don_vi_id(public.current_uid())))));


--
-- Name: vat_tu vat_tu_write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vat_tu_write ON public.vat_tu USING (public.can_manage_equipment(public.current_uid())) WITH CHECK (public.can_manage_equipment(public.current_uid()));


--
-- Name: vi_tri_media; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vi_tri_media ENABLE ROW LEVEL SECURITY;

--
-- Name: vi_tri_media vi_tri_media_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_delete ON public.vi_tri_media FOR DELETE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: vi_tri_media vi_tri_media_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_insert ON public.vi_tri_media FOR INSERT TO authenticated WITH CHECK (((created_by = public.current_uid()) AND public.is_active_user(public.current_uid())));


--
-- Name: vi_tri_media vi_tri_media_read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_read ON public.vi_tri_media FOR SELECT TO authenticated USING (public.is_active_user(public.current_uid()));


--
-- Name: vi_tri_media vi_tri_media_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY vi_tri_media_update ON public.vi_tri_media FOR UPDATE TO authenticated USING (((created_by = public.current_uid()) OR public.can_manage_equipment(public.current_uid())));


--
-- Name: webauthn_credentials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


