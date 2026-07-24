-- 1. Bổ sung cột liên kết hệ thống nơi còn thiếu
ALTER TABLE public.su_co   ADD COLUMN IF NOT EXISTS he_thong_id uuid;
ALTER TABLE public.bao_tri ADD COLUMN IF NOT EXISTS he_thong_id uuid;
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS he_thong_id uuid;

-- 2. Backfill thiet_bi_id từ mã thiết bị (text)
UPDATE public.su_co s   SET thiet_bi_id = t.id FROM public.thiet_bi t
  WHERE s.thiet_bi_id IS NULL AND t.ma_thiet_bi = s.thiet_bi;
UPDATE public.bao_tri s SET thiet_bi_id = t.id FROM public.thiet_bi t
  WHERE s.thiet_bi_id IS NULL AND t.ma_thiet_bi = s.thiet_bi;
UPDATE public.ban_giao s SET thiet_bi_id = t.id FROM public.thiet_bi t
  WHERE s.thiet_bi_id IS NULL AND t.ma_thiet_bi = s.thiet_bi;
UPDATE public.hong_hoc s SET thiet_bi_hong_id = t.id FROM public.thiet_bi t
  WHERE s.thiet_bi_hong_id IS NULL AND t.ma_thiet_bi = s.thiet_bi_hong;
UPDATE public.hong_hoc s SET thiet_bi_thay_the_id = t.id FROM public.thiet_bi t
  WHERE s.thiet_bi_thay_the_id IS NULL AND t.ma_thiet_bi = s.thiet_bi_thay_the;

-- 3. Backfill he_thong_id: từ chuỗi UUID trong cột he_thong, hoặc suy ra từ thiết bị
UPDATE public.su_co s SET he_thong_id = NULLIF(s.he_thong,'')::uuid
  WHERE s.he_thong_id IS NULL AND s.he_thong ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
UPDATE public.bao_tri s SET he_thong_id = NULLIF(s.he_thong,'')::uuid
  WHERE s.he_thong_id IS NULL AND s.he_thong ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
UPDATE public.su_co s SET he_thong_id = t.he_thong_id FROM public.thiet_bi t
  WHERE s.he_thong_id IS NULL AND t.id = s.thiet_bi_id;
UPDATE public.bao_tri s SET he_thong_id = t.he_thong_id FROM public.thiet_bi t
  WHERE s.he_thong_id IS NULL AND t.id = s.thiet_bi_id;
UPDATE public.ban_giao s SET he_thong_id = t.he_thong_id FROM public.thiet_bi t
  WHERE s.he_thong_id IS NULL AND t.id = s.thiet_bi_id;

-- 4. Gỡ các id không còn tồn tại để tránh vi phạm FK
UPDATE public.su_co s SET he_thong_id = NULL
  WHERE he_thong_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = s.he_thong_id);
UPDATE public.bao_tri s SET he_thong_id = NULL
  WHERE he_thong_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = s.he_thong_id);
UPDATE public.ban_giao s SET he_thong_id = NULL
  WHERE he_thong_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = s.he_thong_id);
UPDATE public.giay_phep_khai_thac s SET he_thong_id = NULL
  WHERE he_thong_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = s.he_thong_id);
UPDATE public.su_co s SET thiet_bi_id = NULL
  WHERE thiet_bi_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_id);
UPDATE public.bao_tri s SET thiet_bi_id = NULL
  WHERE thiet_bi_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_id);
UPDATE public.ban_giao s SET thiet_bi_id = NULL
  WHERE thiet_bi_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_id);
UPDATE public.hong_hoc s SET thiet_bi_hong_id = NULL
  WHERE thiet_bi_hong_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_hong_id);
UPDATE public.hong_hoc s SET thiet_bi_thay_the_id = NULL
  WHERE thiet_bi_thay_the_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_thay_the_id);
UPDATE public.giay_phep s SET thiet_bi_id = NULL
  WHERE thiet_bi_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.thiet_bi t WHERE t.id = s.thiet_bi_id);

-- 5. Dọn bản ghi mồ côi (không khớp thiết bị lẫn hệ thống nào còn tồn tại)
DELETE FROM public.su_co s   WHERE s.thiet_bi_id IS NULL AND s.he_thong_id IS NULL;
DELETE FROM public.bao_tri s WHERE s.thiet_bi_id IS NULL AND s.he_thong_id IS NULL;
DELETE FROM public.hong_hoc s WHERE s.thiet_bi_hong_id IS NULL;
DELETE FROM public.ban_giao s WHERE s.thiet_bi_id IS NULL AND s.he_thong_id IS NULL;
DELETE FROM public.giay_phep s WHERE s.thiet_bi_id IS NULL;

-- 6. Thêm khóa ngoại ON DELETE CASCADE (drop trước để cài đúng quy tắc)
ALTER TABLE public.su_co   DROP CONSTRAINT IF EXISTS su_co_thiet_bi_id_fkey;
ALTER TABLE public.su_co   DROP CONSTRAINT IF EXISTS su_co_he_thong_id_fkey;
ALTER TABLE public.su_co
  ADD CONSTRAINT su_co_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id)   ON DELETE CASCADE,
  ADD CONSTRAINT su_co_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;

ALTER TABLE public.bao_tri DROP CONSTRAINT IF EXISTS bao_tri_thiet_bi_id_fkey;
ALTER TABLE public.bao_tri DROP CONSTRAINT IF EXISTS bao_tri_he_thong_id_fkey;
ALTER TABLE public.bao_tri
  ADD CONSTRAINT bao_tri_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id)   ON DELETE CASCADE,
  ADD CONSTRAINT bao_tri_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;

ALTER TABLE public.ban_giao DROP CONSTRAINT IF EXISTS ban_giao_thiet_bi_id_fkey;
ALTER TABLE public.ban_giao DROP CONSTRAINT IF EXISTS ban_giao_he_thong_id_fkey;
ALTER TABLE public.ban_giao
  ADD CONSTRAINT ban_giao_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id)   ON DELETE CASCADE,
  ADD CONSTRAINT ban_giao_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;

ALTER TABLE public.hong_hoc DROP CONSTRAINT IF EXISTS hong_hoc_thiet_bi_hong_id_fkey;
ALTER TABLE public.hong_hoc DROP CONSTRAINT IF EXISTS hong_hoc_thiet_bi_thay_the_id_fkey;
ALTER TABLE public.hong_hoc
  ADD CONSTRAINT hong_hoc_thiet_bi_hong_id_fkey     FOREIGN KEY (thiet_bi_hong_id)     REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
  ADD CONSTRAINT hong_hoc_thiet_bi_thay_the_id_fkey FOREIGN KEY (thiet_bi_thay_the_id) REFERENCES public.thiet_bi(id) ON DELETE SET NULL;

ALTER TABLE public.giay_phep DROP CONSTRAINT IF EXISTS giay_phep_thiet_bi_id_fkey;
ALTER TABLE public.giay_phep
  ADD CONSTRAINT giay_phep_thiet_bi_id_fkey FOREIGN KEY (thiet_bi_id) REFERENCES public.thiet_bi(id) ON DELETE CASCADE;

ALTER TABLE public.giay_phep_khai_thac DROP CONSTRAINT IF EXISTS giay_phep_khai_thac_he_thong_id_fkey;
ALTER TABLE public.giay_phep_khai_thac
  ADD CONSTRAINT giay_phep_khai_thac_he_thong_id_fkey FOREIGN KEY (he_thong_id) REFERENCES public.dm_he_thong(id) ON DELETE CASCADE;

-- 7. Chỉ mục cho các cột khóa ngoại
CREATE INDEX IF NOT EXISTS idx_su_co_thiet_bi_id   ON public.su_co(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_su_co_he_thong_id   ON public.su_co(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_thiet_bi_id ON public.bao_tri(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_bao_tri_he_thong_id ON public.bao_tri(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_ban_giao_thiet_bi_id ON public.ban_giao(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_ban_giao_he_thong_id ON public.ban_giao(he_thong_id);
CREATE INDEX IF NOT EXISTS idx_hong_hoc_thiet_bi_hong_id ON public.hong_hoc(thiet_bi_hong_id);
CREATE INDEX IF NOT EXISTS idx_giay_phep_thiet_bi_id ON public.giay_phep(thiet_bi_id);
CREATE INDEX IF NOT EXISTS idx_gpkt_he_thong_id ON public.giay_phep_khai_thac(he_thong_id);