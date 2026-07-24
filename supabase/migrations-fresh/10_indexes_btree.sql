-- 49 B-tree index cho foreign key còn thiếu.
-- Tại backend cũ các CREATE INDEX này bị cancel do trigger housekeeping timeout.
-- Ở backend mới không có trigger đó → chạy sạch.
-- Dùng CONCURRENTLY để không lock table (yêu cầu chạy ngoài transaction).

-- bao_cao_annotation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bao_cao_annotation_tao_boi ON public.bao_cao_annotation(tao_boi);

-- bao_tri_chinh_sach
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bao_tri_chinh_sach_nguoi_phu_trach_id ON public.bao_tri_chinh_sach(nguoi_phu_trach_id);

-- change_request
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_change_request_resolved_by ON public.change_request(resolved_by);

-- cong_viec_bao_tri
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cong_viec_bao_tri_bao_tri_id ON public.cong_viec_bao_tri(bao_tri_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cong_viec_bao_tri_chinh_sach_id ON public.cong_viec_bao_tri(chinh_sach_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cong_viec_bao_tri_he_thong_id ON public.cong_viec_bao_tri(he_thong_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cong_viec_bao_tri_su_co_id ON public.cong_viec_bao_tri(su_co_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cong_viec_bao_tri_van_de_id ON public.cong_viec_bao_tri(van_de_id);

-- dm_he_thong
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_he_thong_to_chuc_id ON public.dm_he_thong(to_chuc_id);

-- dm_model
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_model_field_set_id ON public.dm_model(field_set_id);

-- dm_to_chuc
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_dm_to_chuc_to_chuc_cha_id ON public.dm_to_chuc(to_chuc_cha_id);

-- form_submission
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submission_template_version_id ON public.form_submission(template_version_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submission_he_thong_id ON public.form_submission(he_thong_id);

-- form_submission_signature
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_form_submission_signature_key_id ON public.form_submission_signature(key_id);

-- gan_chuc_nang / gan_linh_kien
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gan_chuc_nang_hong_hoc_id ON public.gan_chuc_nang(hong_hoc_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_gan_linh_kien_hong_hoc_id ON public.gan_linh_kien(hong_hoc_id);

-- giay_phep_khai_thac
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_giay_phep_khai_thac_he_thong_id ON public.giay_phep_khai_thac(he_thong_id);

-- he_thong_thanh_phan
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_he_thong_thanh_phan_vi_tri_id ON public.he_thong_thanh_phan(vi_tri_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_he_thong_thanh_phan_trang_thai_id ON public.he_thong_thanh_phan(trang_thai_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_he_thong_thanh_phan_loai_thiet_bi_yeu_cau ON public.he_thong_thanh_phan(loai_thiet_bi_yeu_cau);

-- kho / kho_giao_dich
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kho_don_vi_id ON public.kho(don_vi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kho_vi_tri_id ON public.kho(vi_tri_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kho_giao_dich_lien_ket_hong_hoc_id ON public.kho_giao_dich(lien_ket_hong_hoc_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kho_giao_dich_lien_ket_cong_viec_id ON public.kho_giao_dich(lien_ket_cong_viec_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kho_giao_dich_lien_ket_su_co_id ON public.kho_giao_dich(lien_ket_su_co_id);

-- pm_cong_viec
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_cong_viec_bao_tri_id ON public.pm_cong_viec(bao_tri_id);

-- thiet_bi (hot table — nhiều FK)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_danh_gia_nien_han_id ON public.thiet_bi(danh_gia_nien_han_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_don_vi_giu_id ON public.thiet_bi(don_vi_giu_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_nha_cung_cap_id ON public.thiet_bi(nha_cung_cap_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_vi_tri_id ON public.thiet_bi(vi_tri_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_field_set_id ON public.thiet_bi(field_set_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_don_vi_quan_ly_id ON public.thiet_bi(don_vi_quan_ly_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_nhom_he_thong_id ON public.thiet_bi(nhom_he_thong_id);

-- thiet_bi_cap_phat
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_cap_phat_don_vi_giu_id ON public.thiet_bi_cap_phat(don_vi_giu_id);

-- thiet_bi_khe_linh_kien
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_khe_linh_kien_loai_thiet_bi_yeu_cau ON public.thiet_bi_khe_linh_kien(loai_thiet_bi_yeu_cau);

-- thiet_bi_vong_doi
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_vong_doi_den_trang_thai_id ON public.thiet_bi_vong_doi(den_trang_thai_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thiet_bi_vong_doi_tu_trang_thai_id ON public.thiet_bi_vong_doi(tu_trang_thai_id);

-- thong_bao
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thong_bao_cau_hinh_don_vi_id ON public.thong_bao_cau_hinh(don_vi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_thong_bao_email_queue_thong_bao_id ON public.thong_bao_email_queue(thong_bao_id);

-- tickets
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_su_co_id ON public.tickets(su_co_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_he_thong_id ON public.tickets(he_thong_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tickets_thiet_bi_id ON public.tickets(thiet_bi_id);

-- user_scope
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_scope_don_vi_id ON public.user_scope(don_vi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_scope_to_chuc_id ON public.user_scope(to_chuc_id);

-- van_de
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_van_de_he_thong_id ON public.van_de(he_thong_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_van_de_thiet_bi_id ON public.van_de(thiet_bi_id);

-- vat_tu
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vat_tu_nha_cung_cap_id ON public.vat_tu(nha_cung_cap_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vat_tu_don_vi_id ON public.vat_tu(don_vi_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vat_tu_model_id ON public.vat_tu(model_id);

-- ANALYZE để planner cập nhật statistics
ANALYZE;
