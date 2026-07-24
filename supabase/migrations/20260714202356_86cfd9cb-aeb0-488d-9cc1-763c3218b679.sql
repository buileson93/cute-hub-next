-- Task 41 — Indexes for list/sort/filter hot paths (fixed audit_log columns).

CREATE INDEX IF NOT EXISTS idx_dm_he_thong_ten ON public.dm_he_thong (ten);
CREATE INDEX IF NOT EXISTS idx_dm_vi_tri_thu_tu ON public.dm_vi_tri (thu_tu);
CREATE INDEX IF NOT EXISTS idx_http_thu_tu_ma
  ON public.he_thong_thanh_phan (thu_tu NULLS LAST, ma_thanh_phan);
CREATE INDEX IF NOT EXISTS idx_gpkt_gp_han ON public.giay_phep_khai_thac (gp_han);

-- audit_log: (entity, entity_id, created_at DESC) — dùng ở trang lịch sử bản ghi
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id_created
  ON public.audit_log (entity, entity_id, created_at DESC);

-- gan_chuc_nang WHERE den_ngay IS NULL — hot filter (partial)
CREATE INDEX IF NOT EXISTS idx_gcn_active
  ON public.gan_chuc_nang (thiet_bi_id) WHERE den_ngay IS NULL;

CREATE INDEX IF NOT EXISTS idx_dm_model_ten ON public.dm_model (ten);
CREATE INDEX IF NOT EXISTS idx_kgd_created_at ON public.kho_giao_dich (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hong_hoc_created_at ON public.hong_hoc (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_su_co_created_at ON public.su_co (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bao_tri_created_at ON public.bao_tri (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ban_giao_created_at ON public.ban_giao (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_submission_he_thong_created
  ON public.form_submission (he_thong_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submission_thiet_bi_created
  ON public.form_submission (thiet_bi_id, created_at DESC);

ANALYZE public.dm_he_thong;
ANALYZE public.dm_vi_tri;
ANALYZE public.he_thong_thanh_phan;
ANALYZE public.giay_phep_khai_thac;
ANALYZE public.audit_log;
ANALYZE public.gan_chuc_nang;
ANALYZE public.dm_model;
ANALYZE public.kho_giao_dich;
ANALYZE public.hong_hoc;
ANALYZE public.su_co;
ANALYZE public.bao_tri;
ANALYZE public.ban_giao;
ANALYZE public.notifications;
ANALYZE public.form_submission;