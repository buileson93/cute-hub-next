-- Create table for spare parts compatibility with systems
CREATE TABLE public.thiet_bi_he_thong_tuong_thich (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thiet_bi_id UUID NOT NULL REFERENCES public.thiet_bi(id) ON DELETE CASCADE,
    he_thong_id UUID NOT NULL REFERENCES public.dm_he_thong(id) ON DELETE CASCADE,
    phan_loai TEXT DEFAULT 'Thay thế trực tiếp',
    danh_gia TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (thiet_bi_id, he_thong_id)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thiet_bi_he_thong_tuong_thich TO authenticated;
GRANT ALL ON public.thiet_bi_he_thong_tuong_thich TO service_role;

-- Enable RLS
ALTER TABLE public.thiet_bi_he_thong_tuong_thich ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated users to read compatibility"
    ON public.thiet_bi_he_thong_tuong_thich
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to manage compatibility"
    ON public.thiet_bi_he_thong_tuong_thich
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.thiet_bi_he_thong_tuong_thich IS 'Lưu thông tin tương thích giữa tài sản (vật tư dự phòng) và các hệ thống kỹ thuật.';
