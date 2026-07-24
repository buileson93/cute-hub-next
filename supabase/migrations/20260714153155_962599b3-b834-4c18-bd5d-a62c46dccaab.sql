
-- Bảng người/nhóm nhận thông báo qua Telegram
CREATE TABLE public.telegram_subscriber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_id text NOT NULL,
  ten text NOT NULL,
  la_nhom boolean NOT NULL DEFAULT false,
  don_vi_id text,
  cac_loai text[] NOT NULL DEFAULT ARRAY['gp_expiring','su_co','bao_tri_kiem_ke']::text[],
  nguong_ngay integer NOT NULL DEFAULT 90,
  gio_gui integer NOT NULL DEFAULT 8,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chat_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.telegram_subscriber TO authenticated;
GRANT ALL ON public.telegram_subscriber TO service_role;

ALTER TABLE public.telegram_subscriber ENABLE ROW LEVEL SECURITY;

-- Người dùng thấy đăng ký của mình; admin thấy tất cả
CREATE POLICY "tele_sub_select_own_or_admin"
ON public.telegram_subscriber FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() = created_by
  OR public.has_role(auth.uid(),'admin')
);

CREATE POLICY "tele_sub_insert_self_or_admin"
ON public.telegram_subscriber FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR public.has_role(auth.uid(),'admin')
);

CREATE POLICY "tele_sub_update_own_or_admin"
ON public.telegram_subscriber FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "tele_sub_delete_own_or_admin"
ON public.telegram_subscriber FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_tele_sub_updated
BEFORE UPDATE ON public.telegram_subscriber
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bảng khử trùng lặp: mỗi (loại, ref_id, chat_id) chỉ gửi 1 lần trong cửa sổ ngày
CREATE TABLE public.telegram_da_gui (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loai text NOT NULL,
  ref_id text NOT NULL,
  ref_meta jsonb,
  chat_id text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (loai, ref_id, chat_id)
);

GRANT SELECT, INSERT ON public.telegram_da_gui TO authenticated;
GRANT ALL ON public.telegram_da_gui TO service_role;

ALTER TABLE public.telegram_da_gui ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tele_dagui_select_admin"
ON public.telegram_da_gui FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_telegram_da_gui_sent ON public.telegram_da_gui (sent_at DESC);
