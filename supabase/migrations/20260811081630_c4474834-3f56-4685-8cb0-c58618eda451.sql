-- T43 Cleanup: Xử lý các tài sản đang bị lắp trùng lặp ở nhiều vị trí (do lỗi dữ liệu cũ)
-- Giữ lại bản ghi mới nhất (theo tu_ngay), đóng các bản ghi cũ.

UPDATE public.gan_chuc_nang g1
SET den_ngay = now(),
    ghi_chu = coalesce(ghi_chu, '') || ' [T43 Cleanup: Đóng do trùng lặp tài sản]'
WHERE den_ngay IS NULL
AND EXISTS (
    SELECT 1 
    FROM public.gan_chuc_nang g2 
    WHERE g2.thiet_bi_id = g1.thiet_bi_id 
    AND g2.den_ngay IS NULL 
    AND g2.tu_ngay > g1.tu_ngay
    AND g2.id != g1.id
);