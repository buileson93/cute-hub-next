-- T43 Step 3: Thiết lập ràng buộc duy nhất cho tài sản đang hoạt động
-- Đã dọn dẹp dữ liệu trùng lặp ở bước trước.

DROP INDEX IF EXISTS public.idx_gan_chuc_nang_thiet_bi_open;

CREATE UNIQUE INDEX IF NOT EXISTS uq_gcn_thiet_bi_active 
ON public.gan_chuc_nang (thiet_bi_id) 
WHERE (den_ngay IS NULL);

GRANT SELECT ON TABLE public.gan_chuc_nang TO authenticated;
GRANT SELECT ON TABLE public.gan_chuc_nang TO anon;