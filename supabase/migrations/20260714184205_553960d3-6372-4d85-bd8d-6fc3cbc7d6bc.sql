ALTER TABLE public.thiet_bi ADD COLUMN IF NOT EXISTS nguon_nhap text NOT NULL DEFAULT 'thu_cong';
ALTER TABLE public.vat_tu ADD COLUMN IF NOT EXISTS nguon_nhap text NOT NULL DEFAULT 'thu_cong';
ALTER TABLE public.kho_giao_dich ADD COLUMN IF NOT EXISTS nguon_nhap text NOT NULL DEFAULT 'thu_cong';
COMMENT ON COLUMN public.thiet_bi.nguon_nhap IS 'Nguồn tạo bản ghi: thu_cong | import_csv | import_allinone | api | ...';
COMMENT ON COLUMN public.vat_tu.nguon_nhap IS 'Nguồn tạo bản ghi (import truy vết).';
COMMENT ON COLUMN public.kho_giao_dich.nguon_nhap IS 'Nguồn tạo bản ghi (import truy vết).';