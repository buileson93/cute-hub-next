-- ============================================================================
-- T16 — Ticket → Sự cố (Incident) → Vấn đề (Problem) → Thay đổi (Change)
-- Lát cắt tối thiểu: liên kết chuỗi, promote idempotent, SLA từ timestamp thật,
-- phê duyệt + kế hoạch rollback cho thay đổi kỹ thuật. Không hợp nhất bảng.
-- ============================================================================

-- 1) BẢNG VẤN ĐỀ (PROBLEM) --------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.van_de_ma_seq;

CREATE TABLE public.van_de (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_van_de text UNIQUE,
  tieu_de text NOT NULL,
  mo_ta text,
  nguyen_nhan_goc text,
  bien_phap_khac_phuc text,
  trang_thai text NOT NULL DEFAULT 'moi',
  muc_do text NOT NULL DEFAULT 'trung_binh',
  thiet_bi_id uuid REFERENCES public.thiet_bi(id) ON DELETE SET NULL,
  he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  don_vi_id_snapshot uuid,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.van_de TO authenticated;
GRANT ALL ON public.van_de TO service_role;

ALTER TABLE public.van_de ENABLE ROW LEVEL SECURITY;

CREATE POLICY van_de_select ON public.van_de FOR SELECT
USING (
  is_active_user(auth.uid()) AND (
    can_manage_equipment(auth.uid())
    OR (thiet_bi_id IS NOT NULL AND can_view_thiet_bi(thiet_bi_id, auth.uid()))
    OR (don_vi_id_snapshot IS NOT NULL AND don_vi_id_snapshot = get_user_don_vi_id(auth.uid()))
  )
);
CREATE POLICY van_de_write ON public.van_de FOR ALL
USING (can_manage_equipment(auth.uid()))
WITH CHECK (can_manage_equipment(auth.uid()));

CREATE OR REPLACE FUNCTION public.gen_ma_van_de()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.ma_van_de IS NULL OR btrim(NEW.ma_van_de) = '' THEN
    NEW.ma_van_de := 'VD-' || lpad(nextval('public.van_de_ma_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_van_de_ma BEFORE INSERT ON public.van_de
  FOR EACH ROW EXECUTE FUNCTION public.gen_ma_van_de();
CREATE TRIGGER trg_van_de_snapshot BEFORE INSERT OR UPDATE ON public.van_de
  FOR EACH ROW EXECUTE FUNCTION public.trg_fill_don_vi_snapshot();
CREATE TRIGGER trg_van_de_updated BEFORE UPDATE ON public.van_de
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_van_de_audit AFTER INSERT OR UPDATE OR DELETE ON public.van_de
  FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();

-- 2) LIÊN KẾT TICKET → ASSET / INCIDENT + SLA ------------------------------
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS thiet_bi_id uuid REFERENCES public.thiet_bi(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS he_thong_id uuid REFERENCES public.dm_he_thong(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS su_co_id uuid REFERENCES public.su_co(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sla_han timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at timestamptz;

CREATE OR REPLACE FUNCTION public.trg_ticket_sla()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.sla_han IS NULL THEN
      NEW.sla_han := COALESCE(NEW.created_at, now()) + CASE NEW.uu_tien
        WHEN 'khan' THEN interval '4 hours'
        WHEN 'cao' THEN interval '24 hours'
        WHEN 'trung_binh' THEN interval '48 hours'
        ELSE interval '72 hours' END;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.first_response_at IS NULL AND OLD.trang_thai = 'moi' AND NEW.trang_thai <> 'moi' THEN
      NEW.first_response_at := now();
    END IF;
    IF NEW.closed_at IS NULL AND NEW.trang_thai IN ('dong','hoan_thanh') THEN
      NEW.closed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_tickets_sla BEFORE INSERT OR UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.trg_ticket_sla();

-- backfill SLA cho ticket cũ dựa trên timestamp thật
UPDATE public.tickets SET sla_han = created_at + CASE uu_tien
  WHEN 'khan' THEN interval '4 hours'
  WHEN 'cao' THEN interval '24 hours'
  WHEN 'trung_binh' THEN interval '48 hours'
  ELSE interval '72 hours' END
WHERE sla_han IS NULL;

-- 3) INCIDENT → PROBLEM + back-ref TICKET -----------------------------------
ALTER TABLE public.su_co
  ADD COLUMN IF NOT EXISTS van_de_id uuid REFERENCES public.van_de(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.tickets(id) ON DELETE SET NULL;

-- 4) CHANGE / WORK ORDER: approval + rollback + liên kết --------------------
ALTER TABLE public.cong_viec_bao_tri
  ADD COLUMN IF NOT EXISTS van_de_id uuid REFERENCES public.van_de(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS su_co_id uuid REFERENCES public.su_co(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS can_phe_duyet boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trang_thai_phe_duyet text NOT NULL DEFAULT 'chua_duyet',
  ADD COLUMN IF NOT EXISTS nguoi_phe_duyet uuid,
  ADD COLUMN IF NOT EXISTS phe_duyet_at timestamptz,
  ADD COLUMN IF NOT EXISTS ke_hoach_rollback text;

-- 5) RPC: promote ticket → sự cố (idempotent) -------------------------------
CREATE OR REPLACE FUNCTION public.promote_ticket_to_su_co(p_ticket_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_t public.tickets;
  v_su_co uuid;
BEGIN
  SELECT * INTO v_t FROM public.tickets WHERE id = p_ticket_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy yêu cầu hỗ trợ'; END IF;

  IF NOT (v_t.created_by = auth.uid() OR v_t.assigned_to = auth.uid() OR has_role(auth.uid(),'admin')) THEN
    RAISE EXCEPTION 'Không có quyền với yêu cầu này';
  END IF;
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Cần quyền quản lý thiết bị để tạo sự cố';
  END IF;

  -- idempotent: đã promote thì trả về sự cố cũ, không tạo trùng
  IF v_t.su_co_id IS NOT NULL THEN RETURN v_t.su_co_id; END IF;

  INSERT INTO public.su_co(hien_tuong, thiet_bi_id, he_thong_id, ngay_phat_hien, trang_thai, ticket_id)
  VALUES (
    v_t.tieu_de || COALESCE(E'\n' || v_t.mo_ta, ''),
    v_t.thiet_bi_id, v_t.he_thong_id, current_date, 'moi', v_t.id
  )
  RETURNING id INTO v_su_co;

  UPDATE public.tickets SET su_co_id = v_su_co, updated_at = now() WHERE id = p_ticket_id;

  RETURN v_su_co;
END; $$;

REVOKE ALL ON FUNCTION public.promote_ticket_to_su_co(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.promote_ticket_to_su_co(uuid) TO authenticated, service_role;

-- 6) RPC: phê duyệt thay đổi / công việc -------------------------------------
CREATE OR REPLACE FUNCTION public.phe_duyet_cong_viec(p_id uuid, p_approve boolean, p_ghi_chu text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT can_manage_equipment(auth.uid()) THEN
    RAISE EXCEPTION 'Không có quyền phê duyệt';
  END IF;
  UPDATE public.cong_viec_bao_tri
  SET trang_thai_phe_duyet = CASE WHEN p_approve THEN 'da_duyet' ELSE 'tu_choi' END,
      nguoi_phe_duyet = auth.uid(),
      phe_duyet_at = now(),
      ghi_chu = COALESCE(ghi_chu, '') ||
        CASE WHEN p_ghi_chu IS NOT NULL AND btrim(p_ghi_chu) <> ''
             THEN E'\n[' || CASE WHEN p_approve THEN 'Duyệt' ELSE 'Từ chối' END || '] ' || p_ghi_chu
             ELSE '' END,
      updated_at = now()
  WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Không tìm thấy công việc'; END IF;
END; $$;

REVOKE ALL ON FUNCTION public.phe_duyet_cong_viec(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.phe_duyet_cong_viec(uuid, boolean, text) TO authenticated, service_role;

-- 7) VIEW đọc chuỗi liên kết cho timeline / báo cáo -------------------------
CREATE OR REPLACE VIEW public.v_van_de AS
SELECT
  vd.*,
  tb.ma_thiet_bi AS thiet_bi_ma,
  tb.ten_thiet_bi AS thiet_bi_ten,
  ht.ten AS he_thong_ten,
  dv.ten AS don_vi_ten,
  (SELECT count(*) FROM public.su_co sc WHERE sc.van_de_id = vd.id) AS so_su_co,
  (SELECT count(*) FROM public.cong_viec_bao_tri cv WHERE cv.van_de_id = vd.id) AS so_thay_doi
FROM public.van_de vd
LEFT JOIN public.thiet_bi tb ON tb.id = vd.thiet_bi_id
LEFT JOIN public.dm_he_thong ht ON ht.id = vd.he_thong_id
LEFT JOIN public.dm_don_vi dv ON dv.id = vd.don_vi_id_snapshot;

GRANT SELECT ON public.v_van_de TO authenticated, service_role;