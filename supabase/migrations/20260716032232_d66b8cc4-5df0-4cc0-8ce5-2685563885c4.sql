
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS nguoi_giao_id uuid;
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS nguoi_nhan_id uuid;
ALTER TABLE public.ban_giao ADD COLUMN IF NOT EXISTS chu_ky_url text;
