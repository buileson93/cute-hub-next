-- 1. Thêm loại đề xuất mới
ALTER TYPE public.change_request_loai ADD VALUE IF NOT EXISTS 'thiet_bi.propose_field';
ALTER TYPE public.change_request_loai ADD VALUE IF NOT EXISTS 'he_thong.propose_field';

-- 2. Bảng nhiệm vụ nhập liệu
CREATE TABLE IF NOT EXISTS public.nhiem_vu_nhap_lieu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loai text NOT NULL, -- Khớp với ReviewCategory
    entity text NOT NULL,
    target_id uuid NOT NULL,
    field_key text,
    don_vi_id uuid REFERENCES public.dm_don_vi(id),
    nguoi_nhan uuid REFERENCES auth.users(id),
    trang_thai text NOT NULL DEFAULT 'moi', -- CHECK (trang_thai IN ('moi', 'dang_lam', 'da_gui', 'hoan_thanh', 'bo_qua'))
    do_uu_tien int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- 3. Bảng đóng góp điểm
CREATE TABLE IF NOT EXISTS public.dong_gop_diem (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    change_request_id uuid REFERENCES public.change_request(id),
    nhiem_vu_id uuid REFERENCES public.nhiem_vu_nhap_lieu(id),
    loai_dong_gop text NOT NULL,
    diem int NOT NULL,
    ky text NOT NULL, -- VD 2026-08
    created_at timestamptz DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nhiem_vu_nhap_lieu TO authenticated;
GRANT ALL ON public.nhiem_vu_nhap_lieu TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dong_gop_diem TO authenticated;
GRANT ALL ON public.dong_gop_diem TO service_role;

-- RLS
ALTER TABLE public.nhiem_vu_nhap_lieu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dong_gop_diem ENABLE ROW LEVEL SECURITY;
