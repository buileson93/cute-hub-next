-- ============================================================================
-- MÔ HÌNH 3 LỚP THIẾT BỊ — BƯỚC 1: bảng vị trí chức năng + lịch sử lắp đặt.
-- A. dm_he_thong (giữ nguyên) = hệ thống khai thác.
-- B. he_thong_thanh_phan     = VỊ TRÍ CHỨC NĂNG (ổ cắm chức năng, không serial).
-- C. thiet_bi (giữ nguyên)   = THIẾT BỊ CỤ THỂ (vật lý, có serial).
-- gan_chuc_nang = quan hệ B<->C có THỜI HẠN hiệu lực (lịch sử lắp/tháo/thay/tráo).
-- Bước này CHỈ tạo bảng + index + grant. RLS/trigger/audit ở bước 2.
-- ============================================================================

-- 1. VỊ TRÍ CHỨC NĂNG (nhịp thay đổi CẤU TRÚC: khai thêm / sửa / ngừng).
CREATE TABLE IF NOT EXISTS public.he_thong_thanh_phan (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  he_thong_id           uuid NOT NULL REFERENCES public.dm_he_thong(id) ON DELETE CASCADE,
  ma_thanh_phan         text NOT NULL,
  ten                   text NOT NULL,
  loai_thiet_bi_yeu_cau uuid REFERENCES public.dm_loai_thiet_bi(id) ON DELETE SET NULL,
  thanh_phan_cha        uuid REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE,
  bat_buoc              boolean NOT NULL DEFAULT true,
  thu_tu                int,
  mo_ta                 text,
  -- Vòng đời của chính vị trí (khai thêm/ngừng, không xoá cứng -> giữ lý lịch hệ thống):
  trang_thai            text NOT NULL DEFAULT 'hoat_dong'
                          CHECK (trang_thai IN ('hoat_dong','ngung')),
  hieu_luc_tu           date,
  hieu_luc_den          date,
  don_vi_id_snapshot    uuid,
  created_by            uuid DEFAULT auth.uid(),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (he_thong_id, ma_thanh_phan),
  CHECK (hieu_luc_den IS NULL OR hieu_luc_tu IS NULL OR hieu_luc_den >= hieu_luc_tu)
);

-- 2. LỊCH SỬ LẮP ĐẶT (nhịp thay đổi VẬN HÀNH: lắp/tháo/thay/tráo thiết bị cụ thể).
CREATE TABLE IF NOT EXISTS public.gan_chuc_nang (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thanh_phan_id       uuid NOT NULL REFERENCES public.he_thong_thanh_phan(id) ON DELETE CASCADE,
  thiet_bi_id         uuid NOT NULL REFERENCES public.thiet_bi(id) ON DELETE RESTRICT,
  tu_ngay             timestamptz NOT NULL DEFAULT now(),
  den_ngay            timestamptz,                      -- NULL = đang hiệu lực
  ly_do               text NOT NULL DEFAULT 'lắp mới'
                        CHECK (ly_do IN ('lắp mới','thay do hỏng','điều chuyển','tháo')),
  hong_hoc_id         uuid REFERENCES public.hong_hoc(id) ON DELETE SET NULL,
  nguoi_thuc_hien     uuid,
  ghi_chu             text,
  don_vi_id_snapshot  uuid,
  created_by          uuid DEFAULT auth.uid(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  CHECK (den_ngay IS NULL OR den_ngay >= tu_ngay)
);

-- 3. Ràng buộc bất biến (INVARIANT 3 & 4): tối đa 1 dòng hiệu lực / vị trí / thiết bị.
CREATE UNIQUE INDEX IF NOT EXISTS uq_gcn_thanh_phan_active
  ON public.gan_chuc_nang (thanh_phan_id) WHERE den_ngay IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_gcn_thiet_bi_active
  ON public.gan_chuc_nang (thiet_bi_id)   WHERE den_ngay IS NULL;

-- 4. Chỉ mục phụ trợ.
CREATE INDEX IF NOT EXISTS idx_http_he_thong  ON public.he_thong_thanh_phan (he_thong_id);
CREATE INDEX IF NOT EXISTS idx_http_cha       ON public.he_thong_thanh_phan (thanh_phan_cha);
CREATE INDEX IF NOT EXISTS idx_gcn_thanh_phan ON public.gan_chuc_nang (thanh_phan_id);
CREATE INDEX IF NOT EXISTS idx_gcn_thiet_bi   ON public.gan_chuc_nang (thiet_bi_id);

-- 5. GRANT (Data API không tự cấp quyền cho public schema).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.he_thong_thanh_phan TO authenticated;
GRANT ALL ON public.he_thong_thanh_phan TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gan_chuc_nang TO authenticated;
GRANT ALL ON public.gan_chuc_nang TO service_role;