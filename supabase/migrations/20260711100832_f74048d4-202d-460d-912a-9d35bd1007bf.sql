-- Hàm resolve cho su_co / bao_tri (có cả thiet_bi và he_thong dạng text)
CREATE OR REPLACE FUNCTION public.op_resolve_links_ht_tb()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Thiết bị: điền id từ mã thiết bị nếu chưa có
  IF NEW.thiet_bi_id IS NULL AND NULLIF(NEW.thiet_bi,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi LIMIT 1;
  END IF;
  -- Hệ thống: từ chuỗi UUID trong cột he_thong
  IF NEW.he_thong_id IS NULL AND NEW.he_thong ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    IF EXISTS (SELECT 1 FROM public.dm_he_thong h WHERE h.id = NEW.he_thong::uuid) THEN
      NEW.he_thong_id := NEW.he_thong::uuid;
    END IF;
  END IF;
  -- Hệ thống: suy ra từ thiết bị nếu vẫn chưa có
  IF NEW.he_thong_id IS NULL AND NEW.thiet_bi_id IS NOT NULL THEN
    SELECT t.he_thong_id INTO NEW.he_thong_id FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Hàm resolve cho ban_giao (chỉ thiet_bi text)
CREATE OR REPLACE FUNCTION public.op_resolve_links_tb_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.thiet_bi_id IS NULL AND NULLIF(NEW.thiet_bi,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi LIMIT 1;
  END IF;
  IF NEW.he_thong_id IS NULL AND NEW.thiet_bi_id IS NOT NULL THEN
    SELECT t.he_thong_id INTO NEW.he_thong_id FROM public.thiet_bi t WHERE t.id = NEW.thiet_bi_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Hàm resolve cho hong_hoc (thiết bị hỏng & thay thế)
CREATE OR REPLACE FUNCTION public.op_resolve_links_hong_hoc()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.thiet_bi_hong_id IS NULL AND NULLIF(NEW.thiet_bi_hong,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_hong_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi_hong LIMIT 1;
  END IF;
  IF NEW.thiet_bi_thay_the_id IS NULL AND NULLIF(NEW.thiet_bi_thay_the,'') IS NOT NULL THEN
    SELECT t.id INTO NEW.thiet_bi_thay_the_id FROM public.thiet_bi t WHERE t.ma_thiet_bi = NEW.thiet_bi_thay_the LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_su_co_resolve ON public.su_co;
CREATE TRIGGER trg_su_co_resolve BEFORE INSERT OR UPDATE ON public.su_co
  FOR EACH ROW EXECUTE FUNCTION public.op_resolve_links_ht_tb();

DROP TRIGGER IF EXISTS trg_bao_tri_resolve ON public.bao_tri;
CREATE TRIGGER trg_bao_tri_resolve BEFORE INSERT OR UPDATE ON public.bao_tri
  FOR EACH ROW EXECUTE FUNCTION public.op_resolve_links_ht_tb();

DROP TRIGGER IF EXISTS trg_ban_giao_resolve ON public.ban_giao;
CREATE TRIGGER trg_ban_giao_resolve BEFORE INSERT OR UPDATE ON public.ban_giao
  FOR EACH ROW EXECUTE FUNCTION public.op_resolve_links_tb_only();

DROP TRIGGER IF EXISTS trg_hong_hoc_resolve ON public.hong_hoc;
CREATE TRIGGER trg_hong_hoc_resolve BEFORE INSERT OR UPDATE ON public.hong_hoc
  FOR EACH ROW EXECUTE FUNCTION public.op_resolve_links_hong_hoc();

REVOKE EXECUTE ON FUNCTION public.op_resolve_links_ht_tb() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.op_resolve_links_tb_only() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.op_resolve_links_hong_hoc() FROM anon, public;