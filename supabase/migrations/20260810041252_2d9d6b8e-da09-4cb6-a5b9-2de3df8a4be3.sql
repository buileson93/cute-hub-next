-- 1. Thêm loại đề xuất mới
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'change_request_loai' AND e.enumlabel = 'thiet_bi.propose_field') THEN
        ALTER TYPE public.change_request_loai ADD VALUE 'thiet_bi.propose_field';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'change_request_loai' AND e.enumlabel = 'he_thong.propose_field') THEN
        ALTER TYPE public.change_request_loai ADD VALUE 'he_thong.propose_field';
    END IF;
END $$;

-- 2. Bảng nhiệm vụ nhập liệu
CREATE TABLE IF NOT EXISTS public.nhiem_vu_nhap_lieu (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loai text NOT NULL,
    entity text NOT NULL,
    target_id uuid NOT NULL,
    field_key text,
    don_vi_id uuid REFERENCES public.dm_don_vi(id),
    nguoi_nhan uuid REFERENCES auth.users(id),
    trang_thai text NOT NULL DEFAULT 'moi',
    do_uu_tien int DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT nhiem_vu_nhap_lieu_trang_thai_check CHECK (trang_thai IN ('moi', 'dang_lam', 'da_gui', 'hoan_thanh', 'bo_qua'))
);

-- 3. Bảng đóng góp điểm
CREATE TABLE IF NOT EXISTS public.dong_gop_diem (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    change_request_id uuid REFERENCES public.change_request(id),
    nhiem_vu_id uuid REFERENCES public.nhiem_vu_nhap_lieu(id),
    loai_dong_gop text NOT NULL,
    diem int NOT NULL,
    ky text NOT NULL,
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

CREATE POLICY "Users can see their assigned tasks" ON public.nhiem_vu_nhap_lieu FOR SELECT TO authenticated USING (nguoi_nhan = auth.uid() OR nguoi_nhan IS NULL);
CREATE POLICY "Users can update their assigned tasks" ON public.nhiem_vu_nhap_lieu FOR UPDATE TO authenticated USING (nguoi_nhan = auth.uid());
CREATE POLICY "Users can see their scores" ON public.dong_gop_diem FOR SELECT TO authenticated USING (user_id = auth.uid());