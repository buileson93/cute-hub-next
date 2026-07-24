-- Đổi ON DELETE CASCADE -> SET NULL để giữ lịch sử lý lịch khi xoá thiết bị/hệ thống.
ALTER TABLE public.su_co DROP CONSTRAINT su_co_thiet_bi_id_fkey;
ALTER TABLE public.su_co ADD CONSTRAINT su_co_thiet_bi_id_fkey
  FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;
ALTER TABLE public.su_co DROP CONSTRAINT su_co_he_thong_id_fkey;
ALTER TABLE public.su_co ADD CONSTRAINT su_co_he_thong_id_fkey
  FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;

ALTER TABLE public.bao_tri DROP CONSTRAINT bao_tri_thiet_bi_id_fkey;
ALTER TABLE public.bao_tri ADD CONSTRAINT bao_tri_thiet_bi_id_fkey
  FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;
ALTER TABLE public.bao_tri DROP CONSTRAINT bao_tri_he_thong_id_fkey;
ALTER TABLE public.bao_tri ADD CONSTRAINT bao_tri_he_thong_id_fkey
  FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE SET NULL;

ALTER TABLE public.hong_hoc DROP CONSTRAINT hong_hoc_thiet_bi_hong_id_fkey;
ALTER TABLE public.hong_hoc ADD CONSTRAINT hong_hoc_thiet_bi_hong_id_fkey
  FOREIGN KEY (thiet_bi_hong_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_su_co_thiet_bi_id ON public.su_co(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_su_co_he_thong_id ON public.su_co(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_thiet_bi_id ON public.bao_tri(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_he_thong_id ON public.bao_tri(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_thiet_bi_hong_id ON public.hong_hoc(thiet_bi_hong_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_thiet_bi_thay_the_id ON public.hong_hoc(thiet_bi_thay_the_id);