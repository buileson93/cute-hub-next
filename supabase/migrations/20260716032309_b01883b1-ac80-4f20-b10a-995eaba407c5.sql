
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS da_chap_nhan boolean NOT NULL DEFAULT false;
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS thoi_diem_chap_nhan timestamptz;
