
-- ============== ai_config (singleton) ==============
CREATE TABLE IF NOT EXISTS public.ai_config (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  provider text NOT NULL DEFAULT 'lovable' CHECK (provider IN ('lovable','custom')),
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  base_url text,
  api_key_secret_name text,
  system_prompt text NOT NULL DEFAULT 'Bạn là trợ lý MIRATS. LUÔN trả lời tiếng Việt, ngắn gọn, chuyên nghiệp. Chỉ dùng dữ liệu từ các tool được cung cấp — không đoán số liệu. Nếu không tìm thấy hoặc cần thêm thông tin, hỏi lại người dùng. Khi hiển thị mã/tên thiết bị, giấy phép, biểu mẫu, trích nguyên văn từ tool.',
  max_tokens integer NOT NULL DEFAULT 2048,
  beta_label text NOT NULL DEFAULT 'Beta',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_config_singleton CHECK (id = 1)
);

GRANT SELECT ON public.ai_config TO authenticated;
GRANT ALL ON public.ai_config TO service_role;

ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_config_admin_all" ON public.ai_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ai_config_set_updated_at
  BEFORE UPDATE ON public.ai_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ai_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- RPC public: mọi user đăng nhập xem cấu hình an toàn (không lộ secret name/base url)
CREATE OR REPLACE FUNCTION public.get_ai_public_config()
RETURNS TABLE(enabled boolean, model text, beta_label text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT enabled, model, beta_label FROM public.ai_config WHERE id = 1
$$;

REVOKE ALL ON FUNCTION public.get_ai_public_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ai_public_config() TO authenticated;

-- ============== ai_conversation ==============
CREATE TABLE IF NOT EXISTS public.ai_conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tieu_de text NOT NULL DEFAULT 'Hội thoại mới',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_conversation_user_idx ON public.ai_conversation (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversation TO authenticated;
GRANT ALL ON public.ai_conversation TO service_role;

ALTER TABLE public.ai_conversation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_conversation_owner_all" ON public.ai_conversation
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER ai_conversation_set_updated_at
  BEFORE UPDATE ON public.ai_conversation
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== ai_message ==============
CREATE TABLE IF NOT EXISTS public.ai_message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_conversation(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content jsonb NOT NULL,
  tokens integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_message_conv_idx ON public.ai_message (conversation_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.ai_message TO authenticated;
GRANT ALL ON public.ai_message TO service_role;

ALTER TABLE public.ai_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_message_owner_all" ON public.ai_message
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversation c
      WHERE c.id = ai_message.conversation_id
        AND (c.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_conversation c
      WHERE c.id = ai_message.conversation_id
        AND c.user_id = auth.uid()
    )
  );
